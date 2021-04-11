
import * as http from "std/http";
import * as path from "std/path";
import * as fs from "std/fs";
import * as colors from "std/colors";

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as ReactRouter from "react-router";
import * as query from "query-string";

import { GraphQL } from "./graphql.tsx";
import { Console } from "./console.tsx";
export { Console } from "./console.tsx";
export { Bundler } from "./bundler.tsx";

const mediaTypes: Record<string, string> =
{
    ".gz": "application/gzip",
    ".js": "application/javascript",
    ".json": "application/json",
    ".map": "application/json",
    ".mjs": "application/javascript",
    ".wasm": "application/wasm",

    ".ogg": "audio/ogg",
    ".wav": "audio/wav",

    ".apng": "image/apng",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",

    ".css": "text/css",
    ".html": "text/html",
    ".htm": "text/html",
    ".jsx": "text/jsx",
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".ts": "text/typescript",
    ".tsx": "text/tsx",

    ".webm": "video/webm",
};

const staticMediaTypes: string[] =
    [
        "audio/ogg",
        "audio/wav",

        "image/apng",
        "image/avif",
        "image/gif",
        "image/jpeg",
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "image/webp",

        "text/css",

        "video/webm",
    ];

export type Protocol = "http" | "https";

export interface ServerAttributes
{
    protocol: Protocol;
    domain: string | undefined;
    hostname: string;
    httpPort: number;
    routes: Record<string, string>;

    httpsPort: number | undefined;
    cert: string | undefined;

    App: React.FunctionComponent<{ client: undefined; }>;

    schema: string;
    resolvers: unknown;
}

export class Server
{
    private protocol: Protocol;
    private domain: string;
    private routes: Map<string, string> = new Map<string, string>();

    private httpServer: http.Server;
    private httpsServer: http.Server | undefined;

    private App: React.ComponentType<{ client: undefined; }>;

    constructor(attributes: ServerAttributes)
    {
        this.protocol = attributes.protocol;

        this.App = attributes.App;

        const serveOptions =
        {
            hostname: attributes.hostname,
            port: attributes.httpPort,
        };
        const serveTLSOptions =
        {
            hostname: attributes.hostname,
            port: attributes.httpsPort!,
            certFile: path.join(attributes.cert ?? "", "fullchain.pem"),
            keyFile: path.join(attributes.cert ?? "", "privkey.pem"),
        };
        switch (this.protocol)
        {
            case "http":
                this.httpServer = http.serve(serveOptions);
                break;
            case "https":
                this.httpServer = http.serve(serveOptions);
                this.httpsServer = http.serveTLS(serveTLSOptions);
                break;
            default:
                throw new Error(`unknown protocol ${this.protocol} (please choose HTTP or HTTPS)`);
        }
        for (const key in attributes.routes)
            this.routes.set(key, attributes.routes[key]);

        GraphQL.schema.path = attributes.schema;
        GraphQL.resolvers = attributes.resolvers;

        if (attributes.domain)
            this.domain = `${this.protocol}://${attributes.domain}`;
        else
            this.domain = `${this.protocol}://${this.hostname}:${this.port}`;
    }
    public get port(): number
    {
        const address = this.httpsServer ?
            this.httpsServer.listener.addr as Deno.NetAddr :
            this.httpServer.listener.addr as Deno.NetAddr;
        return address.port;
    }
    public get hostname(): string
    {
        const address = this.httpServer.listener.addr as Deno.NetAddr;
        if ((["::1", "127.0.0.1"]).includes(address.hostname))
            return "localhost";
        return address.hostname;
    }
    public get url(): string
    {
        return `${this.protocol}://${this.hostname}:${this.port}`;
    }
    private async static(request: http.ServerRequest): Promise<http.Response>
    {
        try
        {
            /* Open file and get file length */
            const filepath = path.join(".", request.url);
            const body = await Deno.open(filepath, { read: true });
            const info = await Deno.stat(filepath);

            /* Clean up file RID */
            request.done.then(function () { body.close(); });

            /* Set headers */
            const headers = new Headers();

            if (info.size > 0x4000)
                headers.set("transfer-encoding", "chunked");
            else
                headers.set("content-length", info.size.toString());

            const contentType = mediaTypes[path.extname(filepath)];
            if (contentType)
                headers.set("content-type", contentType);

            /** @todo Add caching. */

            const response: http.Response =
            {
                status: http.Status.OK,
                headers: headers,
                body: body,
            };
            return response;
        }
        catch (error) { return this.page(request); }
    }
    private async graphql(request: http.ServerRequest): Promise<http.Response>
    {
        if (GraphQL.methods.includes(request.method))
        {
            try { return await GraphQL.resolve(request); }
            catch (error) { return this.page(request); }
        }
        else
            return this.page(request);
    }
    private page(request: http.ServerRequest): http.Response
    {
        const headers = new Headers();
        headers.set("content-type", "text/html");

        const staticContext: Record<string, unknown> = {};

        const page: React.ReactElement =
            <html lang="en">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta httpEquiv="Content-Security-Policy" />
                    <meta charSet="UTF-8" />
                    <script src="/.dist/webpack.bundle.js" defer></script>
                    <link rel="stylesheet" href="/static/index.css" />
                </head>
                <body>
                    <div id="root">
                        <ReactRouter.StaticRouter location={request.url} context={staticContext}>
                            <this.App client={undefined} />
                        </ReactRouter.StaticRouter>
                    </div>
                </body>
            </html>;

        const body: string = `<!DOCTYPE html> ${ReactDOMServer.renderToString(page)}` as string;

        if (staticContext.url)
        {
            const headers = new Headers();
            headers.set("location", staticContext.url as string);

            const response: http.Response =
            {
                status: http.Status.TemporaryRedirect,
                headers: headers,
            };
            return response;
        }

        const response: http.Response =
        {
            status: staticContext.statusCode as http.Status ?? http.Status.OK,
            headers: headers,
            body: body,
        };
        return response;
    }
    private async respond(request: http.ServerRequest): Promise<void>
    {
        let response: http.Response | undefined = undefined;

        /* Invalidate cache on new queries */
        request.url = query.parseUrl(request.url).url;

        /* Handle GraphQL */
        if (request.url === "/graphql")
            response ?? (response = await this.graphql(request));

        /* Checks if this URL should be rerouted (alias) */
        if (request.url !== "/" && this.routes.has(request.url))
            request.url = this.routes.get(request.url) as string;

        /* Converts URL to filepath */
        const filepath = path.join(".", request.url);

        /* File not found or is directory -> page */
        if (!await fs.exists(filepath) || (await Deno.stat(filepath)).isDirectory)
            response ?? (response = this.page(request));

        /* File found -> serve static */
        response ?? (response = await this.static(request));

        switch (request.method)
        {
            case "HEAD":
                if (response.status === http.Status.OK)
                    response.status = http.Status.NoContent;
                response.body = undefined;
                break;
            case "GET": case "POST":
                break;
            default:
                response = this.page(request);
                break;
        }

        try { await request.respond(response); }
        catch (error) { Console.error(error); }
    }
    private async redirect(request: http.ServerRequest): Promise<void>
    {
        const location =
            request.headers.get("referer") ??
            `${this.protocol}://${request.headers.get("host")}${request.url}`;
        const headers = new Headers();
        headers.set("location", location);

        const response: http.Response =
        {
            status: http.Status.TemporaryRedirect,
            headers: headers,
        };
        try { await request.respond(response); }
        catch (error) { Console.error(error); }
    }
    public async serve(): Promise<void>
    {
        Console.log(`Building GraphQL...`);
        await GraphQL.build({ url: this.domain });

        Console.log(`Server is running on ${colors.underline(colors.magenta(this.url))}`);
        async function httpRequest(server: Server)
        {
            for await (const request of server.httpServer)
                server.httpsServer ? await server.redirect(request) : await server.respond(request);
        }
        async function httpsRequest(server: Server)
        {
            for await (const request of server.httpsServer!)
                await server.respond(request);
        }
        if (this.httpsServer)
            await Promise.all([httpRequest(this), httpsRequest(this)]);
        else
            await httpRequest(this);
    }
    public close(): void
    {
        this.httpServer.close();
        if (this.httpsServer)
            this.httpsServer.close();
    }
}