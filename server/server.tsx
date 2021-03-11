
import * as http from "https://deno.land/std/http/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import * as query from "https://esm.sh/query-string";

import { Bundler } from "./bundler.tsx";
export { Bundler } from "./bundler.tsx";
import { Console } from "./console.tsx";
export { Console } from "./console.tsx";

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
    port: number;

    routes?: Map<string, string>;

    dev?: boolean;
}

export class Server
{
    private protocol: Protocol;
    private httpServer: http.Server;

    private routes: Map<string, string> = new Map<string, string>();

    private dev: boolean;

    private cacheTime: number = 3153600 as number;

    constructor({ protocol, hostname, port, routes, dev = false }: ServerAttributes)
    {
        this.protocol = protocol;
        const serveOptions =
        {
            hostname: hostname,
            port: port,
        };
        const serveTLSOptions =
        {
            hostname: hostname,
            port: port,
            certFile: "cert/localhost/cert.pem",
            keyFile: "cert/localhost/key.pem",
        };
        switch (this.protocol)
        {
            case "http":
                this.httpServer = http.serve(serveOptions);
                break;
            case "https":
                this.httpServer = http.serveTLS(serveTLSOptions);
                break;
            default:
                throw new Error("unknown server protocol (please choose HTTP or HTTPS)");
        }
        if (routes)
            this.routes = routes;
        else
        {
            this.routes.set("/", "/static/index.html");
            this.routes.set("/favicon.ico", "/static/favicon.ico");
            this.routes.set("/404.html", "/static/404.html");
            this.routes.set("/robots.txt", "/static/robots.txt");
        }
        this.dev = dev;
        Console.dev = this.dev;
    }
    public get port(): number
    {
        const address = this.httpServer.listener.addr as Deno.NetAddr;
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
        const [body, info] = await Promise.all([Deno.open(filePath), Deno.stat(filePath)]);

        /* Set headers */
        const headers = new Headers();
        headers.set("content-length", info.size.toString());
        const contentType = mediaTypes[path.extname(filePath)];
        if (contentType)
            headers.set("content-type", contentType);

        /* Cache static content */
        /** @todo Be more intelligent about cache time */
        if (request.headers.get("cache-control") !== "no-cache" && staticMediaTypes.includes(contentType))
            headers.set("cache-control", "max-age=" + this.cacheTime);

        const response: http.Response =
        {
            headers: headers,
            body: body,
        };
        request.done.then(function () { body.close(); });
        return response;
    }
    private async ok(request: http.ServerRequest): Promise<void>
    {
        const response = await this.file(request);
        response.status = 200;
        try { await request.respond(response); }
        catch (error) { Console.error(error); }
    }
    private async notFound(request: http.ServerRequest): Promise<void>
    {
        request.url = "static/404.html";
        const response = await this.file(request);
        response.status = 404;
        try { await request.respond(response); }
        catch (error) { Console.error(error); }
    }
    private async route(request: http.ServerRequest): Promise<void>
    {
        const originalURL = request.url;
        Console.success("Received " + request.method + " request: " + originalURL);

        /* Invalidate cache on new queries */
        /** @todo Use hash of file data instead */
        request.url = query.parseUrl(request.url).url;

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
    public async serve(): Promise<void>
    {
        Console.log("Bundling client scripts...");
        await (new Bundler()).bundle("client/bundle.tsx", ".httpsaurus");
        Console.success("Bundled client scripts!");
        Console.log("Server is running on " + colors.underline(colors.magenta(this.url)));
        for await (const request of this.httpServer)
            await this.route(request);
    }
    public close(): void
    {
        this.httpServer.close();
    }
}