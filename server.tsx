
import * as http from "https://deno.land/std/http/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import * as React from "react";
import * as ReactDOMServer from "react-dom-server";

interface ServerAttributes
{
    port: number;
    directory: string;
    html404: string;
}

export class Server
{
    httpServer: http.Server;

    port: number;
    directory: string;
    html404: string;
    htmlReact: React.ReactElement;
    html: string;
    constructor({ port, directory, html404 }: ServerAttributes)
    {
        this.port = port;
        this.directory = directory;
        this.httpServer = http.serve({ port: this.port });
        this.html404 = html404;
        this.htmlReact =
            <html lang="en">
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta httpEquiv="Content-Security-Policy" />
                    <link rel="stylesheet" href="style/index.css" />
                </head>
                <body>
                    <div id="root">
                        <script src={"http://localhost:" + this.port + "/client/.bundle/client.js"} defer></script>
                    </div>
                </body>
            </html>;
        this.html = "<!DOCTYPE html>" + ReactDOMServer.renderToString(this.htmlReact);
    }
    async static(url: string): Promise<Deno.Reader>
    {
        const requestPath = path.join(".", url);
        return await Deno.open(requestPath);
    }
    async respond(request: http.ServerRequest): Promise<void>
    {

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
            colors.italic(colors.magenta("http://localhost:" + this.port));
        console.log(logString);
        for await (const request of this.httpServer)
            this.respond(request);
    }
}

const serverAttributes = { port: 8000, directory: ".", html404: "404.html" };

const server = new Server(serverAttributes);
await server.serve();