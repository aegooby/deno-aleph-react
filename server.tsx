
import * as http from "https://deno.land/std/http/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import * as React from "react";
import * as ReactDOMServer from "react-dom-server";

export interface ServerAttributes
{
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
    constructor({ port, directory, html404 }: ServerAttributes)
    {
        this.directory = directory;
        const serveTLSOptions =
        {
            hostname: "localhost",
            port: port,
            certFile: ".deno/https/localhost.crt",
            keyFile: ".deno/https/localhost.key",
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
        if (address.hostname === "::1")
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
        const logString = colors.bold(colors.green(" [$] ")) +
            "Received " + request.method + " request: " + request.url;
        console.log(logString);
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
                    const logString = colors.bold(colors.red(" [!] ")) +
                        "Route " + request.url + " not found";
                    console.log(logString);
                    request.respond({ body: await this.static(this.html404) });
                }
                break;
        }
    }
    async serve(): Promise<void>
    {
        const logString = colors.bold(colors.cyan(" [*] ")) +
            "Server is running on " +
            colors.underline(colors.magenta(this.url));
        console.log(logString);
        for await (const request of this.httpServer)
            this.respond(request);
    }
}

const serverAttributes =
{
    port: 8000,
    directory: ".",
    html404: "static/404.html"
};

const server = new Server(serverAttributes);
await server.serve();