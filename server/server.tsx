
import * as path from "@std/path";
import * as fs from "@std/fs";
import * as colors from "@std/colors";
import * as async from "@std/async";

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as ReactRouter from "react-router";
import * as Oak from "oak";

import { GraphQL } from "./graphql.tsx";
import { Console } from "./console.tsx";
export { Console } from "./console.tsx";
export { Bundler } from "./bundler.tsx";

export interface ServerAttributes
{
    secure: boolean;
    domain: string | undefined;
    hostname: string;
    port: number;
    routes: Record<string, string>;

    portTls: number | undefined;
    cert: string | undefined;

    App: React.FunctionComponent<{ client: undefined; }>;

    schema: string;
    resolvers: unknown;
}

interface OakServer
{
    appBase: Oak.Application;
    appTls: Oak.Application;
    listenOptionsBase: Oak.ListenOptionsBase;
    listenOptionsTls: Oak.ListenOptionsTls;
}

export class Server
{
    private secure: boolean;
    private domain: string;
    private routes: Map<string, string> = new Map<string, string>();

    private oak: OakServer;
    private closed: async.Deferred<void> = async.deferred();

    private graphql: GraphQL;

    private App: React.ComponentType<{ client: undefined; }>;

    constructor(attributes: ServerAttributes)
    {
        this.secure = attributes.secure;

        this.App = attributes.App;

        for (const key in attributes.routes)
        {
            const url = new URL(`key://${key}`);
            switch (url.pathname)
            {
                case "/graphql":
                    throw new Error("Cannot reroute /graphql URL");
                default:
                    this.routes.set(key, attributes.routes[key]);
                    break;
            }
        }

        this.oak =
        {
            appBase: new Oak.Application(),
            appTls: new Oak.Application(),
            listenOptionsBase:
            {
                hostname: attributes.hostname,
                port: attributes.port as number,
                secure: false
            },
            listenOptionsTls:
            {
                hostname: attributes.hostname,
                port: attributes.portTls as number,
                certFile: path.join(attributes.cert ?? "", "fullchain.pem"),
                keyFile: path.join(attributes.cert ?? "", "privkey.pem"),
                alpnProtocols: ["http/1.1", "h2"],
                transport: "tcp",
                secure: true
            }
        };

        this.graphql = new GraphQL(attributes);

        if (attributes.domain)
            this.domain = `${this.protocol}://${attributes.domain}`;
        else
            this.domain = `${this.protocol}://${this.hostname}:${this.port}`;

        this.router = this.router.bind(this);
        this.static = this.static.bind(this);
        this.react = this.react.bind(this);

        this.acceptBase = this.acceptBase.bind(this);
        this.acceptTls = this.acceptTls.bind(this);
        this.accept = this.accept.bind(this);

        this.serve = this.serve.bind(this);
        this.close = this.close.bind(this);
    }
    public get protocol(): "http" | "https"
    {
        return this.secure ? "https" : "http";
    }
    public get port(): number
    {
        return this.secure ? this.oak.listenOptionsTls.port : this.oak.listenOptionsBase.port;
    }
    public get hostname(): string
    {
        return this.oak.listenOptionsTls.hostname as string;
    }
    public get url(): string
    {
        return `${this.protocol}://${this.hostname}:${this.port}`;
    }
    public get urlSimple(): string
    {
        return `${this.protocol}://${this.hostname}`;
    }
    private async router(context: Oak.Context): Promise<void>
    {
        /* Redirect HTTP to HTTPS if it's available. */
        if (!context.request.secure && this.secure)
        {
            const urlRequest = context.request.url;
            const host = context.request.headers.get("host");
            context.response.redirect(`https://${host}${urlRequest.pathname}`);
            return;
        }

        /* Reroute any mapped routes from server configuration */
        if (this.routes.has(context.request.url.pathname))
        {
            const to = this.routes.get(context.request.url.pathname) as string;
            context.response.redirect(to);
            return;
        }

        /* Check for GraphQL */
        if (context.request.url.pathname === "/graphql")
        {
            switch (context.request.method)
            {
                case "GET":
                    await this.graphql.playground(context);
                    return;
                case "POST":
                    await this.graphql.query(context);
                    return;
                default:
                    /** @todo Add error checking. */
                    break;
            }
        }

        /* Convert URL to filepath. */
        const filepath = path.join(".", context.request.url.pathname);

        /* File not found or is directory -> not static. */
        if (!await fs.exists(filepath) || (await Deno.stat(filepath)).isDirectory)
        {
            await this.react(context);
            return;
        }

        await this.static(context);
    }
    private async static(context: Oak.Context): Promise<void>
    {
        const sendOptions: Oak.SendOptions =
        {
            gzip: true,
            hidden: true,
            maxbuffer: 0x400,
            root: Deno.cwd()
        };
        await Oak.send(context, context.request.url.pathname, sendOptions);
    }
    private async react(context: Oak.Context): Promise<void>
    {
        context.response.type = "text/html";

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
                        <ReactRouter.StaticRouter
                            location={context.request.url.pathname}
                            context={staticContext}
                        >
                            <this.App client={undefined} />
                        </ReactRouter.StaticRouter>
                    </div>
                </body>
            </html>;

        const render = Promise.resolve(ReactDOMServer.renderToString(page));
        const body = `<!DOCTYPE html> ${await render}`;

        if (staticContext.url)
            context.response.redirect(staticContext.url as string);

        context.response.status = staticContext.statusCode as Oak.Status ?? Oak.Status.OK;
        context.response.body = body;
    }
    private async acceptBase(): Promise<void>
    {
        await this.oak.appBase.listen(this.oak.listenOptionsBase);
    }
    private async acceptTls(): Promise<void>
    {
        if (!this.secure)
            return;
        await this.oak.appTls.listen(this.oak.listenOptionsTls);
    }
    private async accept(): Promise<void>
    {
        await Promise.all([this.acceptBase(), this.acceptTls()]);
    }
    public async serve(): Promise<void>
    {
        Console.log(`Building GraphQL...`);
        await this.graphql.build({ url: this.domain });

        Console.log(`Server is running on ${colors.underline(colors.magenta(this.url))}`);

        this.oak.appBase.use(this.router);
        this.oak.appTls.use(this.router);

        await Promise.race([this.accept(), this.closed]);
    }
    public close(): void
    {
        this.closed.resolve();
    }
}