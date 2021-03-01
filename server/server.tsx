
import * as http from "http";
import * as path from "path";
import * as colors from "colors";

import * as React from "react";
import * as ReactDOMServer from "react-dom-server";

export class Console
{
    static log(message: string): void
    {
        console.log(colors.bold(colors.cyan("  [*]  ")) + message);
    }
    static success(message: string): void
    {
        console.log(colors.bold(colors.green("  [$]  ")) + message);
    }
    static error(message: string): void
    {
        console.error(colors.bold(colors.red("  [!]  ")) + message);
    }
}

export type Protocol = "unknown" | "http" | "https";

export interface ServerAttributes
{
    protocol: Protocol;
    hostname: string;
    port: number;
}

export class Server
{
    httpServer: http.Server;
    protocol: Protocol;

    constructor({ protocol, hostname, port }: ServerAttributes)
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
            certFile: ".https/localhost/cert.pem",
            keyFile: ".https/localhost/key.pem",
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
    }
    get port(): number
    {
        const address = this.httpServer.listener.addr as Deno.NetAddr;
        return address.port;
    }
    get hostname(): string
    {
        const address = this.httpServer.listener.addr as Deno.NetAddr;
        if ((["::1", "127.0.0.1"]).includes(address.hostname))
            return "localhost";
        return address.hostname;
    }
    get url(): string
    {
        return this.protocol + "://" + this.hostname + ":" + this.port;
    }
    async static(url: string): Promise<Deno.Reader>
    {
        const requestPath = path.join(".", url);
        return await Deno.open(requestPath);
    }
    async respond(request: http.ServerRequest): Promise<void>
    {
        Console.success("Received " + request.method + " request: " + request.url);
        switch (request.url)
        {
            case "/":
                await request.respond({ body: await this.static("/static/index.html") });
                break;
            default:
                try
                {
                    await request.respond({ body: await this.static(request.url) });
                }
                catch (error)
                {
                    Console.error("Route " + request.url + " not found");
                    request.respond({ body: await this.static("/static/404.html") });
                }
                break;
        }
    }
    async serve(): Promise<void>
    {
        Console.log("Server is running on " + colors.underline(colors.magenta(this.url)));
        for await (const request of this.httpServer)
            this.respond(request);
    }
}
