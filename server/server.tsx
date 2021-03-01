
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

export interface ServerAttributes
{
    hostname: string;
    port: number;
    directory: string;
    html404: string;
}

export class Server
{
    httpServer: http.Server;

    directory: string;
    html404: string;
    html: string;
    constructor({ hostname, port, directory, html404 }: ServerAttributes)
    {
        this.directory = directory;
        const serveTLSOptions =
        {
            hostname: hostname,
            port: port,
            certFile: ".https/localhost/cert.pem",
            keyFile: ".https/localhost/key.pem",
        };
        this.httpServer = http.serveTLS(serveTLSOptions);
        this.html404 = html404;
        const htmlReact: React.ReactElement =
            <html lang="en">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta httpEquiv="Content-Security-Policy" />
                    <link rel="stylesheet" href="static/index.css" />
                </head>
                <body>
                    <div id="root">
                        <script src={".deno/client.js"} defer></script>
                    </div>
                </body>
            </html>;
        this.html = "<!DOCTYPE html>" + ReactDOMServer.renderToString(htmlReact);
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
        return "https://" + this.hostname + ":" + this.port;
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
                request.respond({ body: this.html });
                break;
            default:
                try
                {
                    request.respond({ body: await this.static(request.url) });
                }
                catch (error)
                {
                    Console.error("Route " + request.url + " not found");
                    request.respond({ body: await this.static(this.html404) });
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
