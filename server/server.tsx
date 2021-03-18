
import * as http from "https://deno.land/std/http/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import * as query from "https://esm.sh/query-string";

import { Console } from "./console.tsx";
export { Console } from "./console.tsx";

import { GraphQL } from "./graphql.tsx";
import { Page } from "./page.tsx";

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

export type Protocol = "unknown" | "http" | "https";

export interface ServerAttributes
{
    protocol: Protocol;
    hostname: string;
    httpPort: number;

    httpsPort?: number;
    cert?: string;

    resolvers: unknown;
    routes: Record<string, string>;
}

export class Server
{
    private protocol: Protocol;

    private httpServer: http.Server;
    private httpsServer?: http.Server;

    private routes: Map<string, string> = new Map<string, string>();

    constructor(attributes: ServerAttributes)
    {
        this.protocol = attributes.protocol;
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
                throw new Error("unknown server protocol (please choose HTTP or HTTPS)");
        }
        for (const key in attributes.routes)
            this.routes.set(key, attributes.routes[key]);

        GraphQL.schema.path = "graphql/schema.gql";
        GraphQL.resolvers = attributes.resolvers;
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
        return this.protocol + "://" + this.hostname + ":" + this.port;
    }
    private async static(request: http.ServerRequest): Promise<void>
    {
        try
        {
            /* Open file and get file length */
            const filePath = request.url;
            const body = await Deno.open(filePath, { read: true });
            const info = await Deno.stat(filePath);

            /* Clean up file RID */
            request.done.then(function () { body.close(); });

            /* Set headers */
            const headers = new Headers();

            if (info.size > 0x4000)
                headers.set("transfer-encoding", "chunked");
            else
                headers.set("content-length", info.size.toString());

            const contentType = mediaTypes[path.extname(filePath)];
            if (contentType)
                headers.set("content-type", contentType);

            /** @todo Add caching. */

            const response: http.Response =
            {
                status: http.Status.OK,
                headers: headers,
                body: body,
            };
            request.respond(response);
        }
        catch (error) { await this.page(request, http.Status.InternalServerError); }
    }
    private async graphql(request: http.ServerRequest): Promise<void>
    {
        if (GraphQL.methods.includes(request.method))
        {
            try { request.respond(await GraphQL.resolve(request)); }
            catch (error) { await this.page(request, http.Status.InternalServerError); }
        }
        else
            await this.page(request, http.Status.MethodNotAllowed);
    }
    private async page(request: http.ServerRequest, status: http.Status): Promise<void>
    {
        const headers = new Headers();
        headers.set("content-type", "text/html");
        const response: http.Response =
        {
            status: status,
            headers: headers,
            body: Page.render(status),
        };
        try { await request.respond(response); }
        catch (error) { Console.error(error); }
    }
    private async respond(request: http.ServerRequest): Promise<void>
    {
        const originalURL = request.url;
        Console.success("Received " + request.method + " request: " + originalURL);

        /* Invalidate cache on new queries */
        request.url = query.parseUrl(request.url).url;

        /* Handle GraphQL */
        if (request.url === "/graphql")
            return await this.graphql(request);

        /* Checks if this URL should be rerouted (alias) */
        if (this.routes.has(request.url))
            request.url = this.routes.get(request.url) as string;

        /* Check the special case index "/" URL */
        if (request.url === "/")
            return await this.page(request, http.Status.OK);

        /* Converts URL to filepath */
        request.url = path.join(".", request.url);

        /* File not found or is directory -> 404 */
        if (!await fs.exists(request.url) || (await Deno.stat(request.url)).isDirectory)
        {
            Console.error("Route " + originalURL + " not found");
            return await this.page(request, http.Status.NotFound);
        }

        /* File found -> serve static */
        return await this.static(request);
    }
    private async redirect(request: http.ServerRequest): Promise<void>
    {
        const location =
            (request.headers.get("referer") ?? "https://" + request.headers.get("host")) + request.url;
        const headers = new Headers();
        headers.set("location", location);

        const response: http.Response =
        {
            status: http.Status.TemporaryRedirect,
            headers: headers,
        };
        await request.respond(response);
    }
    public async serve(): Promise<void>
    {
        Console.log("Building GraphQL...");
        await GraphQL.build({ url: this.url });

        Console.log("Server is running on " + colors.underline(colors.magenta(this.url)));
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