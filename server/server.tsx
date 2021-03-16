
import * as http from "https://deno.land/std/http/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import * as query from "https://esm.sh/query-string";

import { Bundler } from "./bundler.tsx";
export { Bundler } from "./bundler.tsx";
import { Console } from "./console.tsx";
export { Console } from "./console.tsx";

import { GraphQL } from "./graphql.tsx";

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
    private graphql: GraphQL;

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
                {
                    this.httpServer = http.serve(serveOptions);
                    break;
                }
            case "https":
                {
                    this.httpServer = http.serve(serveOptions);
                    this.httpsServer = http.serveTLS(serveTLSOptions);
                    break;
                }
            default:
                throw new Error("unknown server protocol (please choose HTTP or HTTPS)");
        }
        for (const key in attributes.routes)
            this.routes.set(key, attributes.routes[key]);
        this.graphql = new GraphQL({ schema: "graphql/schema.gql", resolvers: attributes.resolvers });
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
    private async file(request: http.ServerRequest): Promise<http.Response>
    {
        /* Open file and get file length */
        const filePath = request.url;
        const file = await Deno.open(filePath, { read: true });
        const array = await Deno.readAll(file);
        file.close();
        const info = await Deno.stat(filePath);

        /* Set headers */
        const headers = new Headers();
        headers.set("content-length", info.size.toString());
        const contentType = mediaTypes[path.extname(filePath)];
        if (contentType)
            headers.set("content-type", contentType);

        /** @todo Add caching. */

        const response: http.Response =
        {
            headers: headers,
            body: (new TextDecoder()).decode(array),
        };
        // request.done.then(function () { file.close(); });
        return response;
    }
    private async ok(request: http.ServerRequest): Promise<void>
    {
        try 
        {
            const response = await this.file(request);
            response.status = 200;
            await request.respond(response);
        }
        catch (error) { Console.error(error); }
    }
    private async notFound(request: http.ServerRequest): Promise<void>
    {
        try
        {
            request.url = "static/404.html";
            const response = await this.file(request);
            response.status = 404;
            await request.respond(response);
        }
        catch (error) { Console.error(error); }
    }
    private async respond(request: http.ServerRequest): Promise<void>
    {
        const originalURL = request.url;
        Console.success("Received " + request.method + " request: " + originalURL);

        /* Invalidate cache on new queries */
        request.url = query.parseUrl(request.url).url;

        if (request.url === "/graphql")
            return await this.graphql.respond(request);

        /* Checks if this URL should be rerouted (alias) */
        if (this.routes.has(request.url))
            request.url = this.routes.get(request.url) as string;

        /* Converts URL to filepath */
        request.url = path.join(".", request.url);
        if (!await fs.exists(request.url))
        {
            Console.error("Route " + originalURL + " not found");
            return await this.notFound(request);
        }
        return await this.ok(request);
    }
    private async redirect(request: http.ServerRequest): Promise<void>
    {
        const location =
            (request.headers.get("referer") ?? "https://" + request.headers.get("host")) + request.url;
        const headers = new Headers();
        headers.set("location", location);

        const response: http.Response =
        {
            status: 307,
            headers: headers,
            body: ""
        };
        await request.respond(response);
    }
    public async serve(): Promise<void>
    {
        Console.log("Bundling client scripts...");
        await (new Bundler()).bundle("client/bundle.tsx", ".httpsaurus");

        Console.log("Building GraphQL...");
        await this.graphql.build({ url: this.url });

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