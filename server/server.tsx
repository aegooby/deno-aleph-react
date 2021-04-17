
import * as path from "@std/path";
import * as fs from "@std/fs";
import * as colors from "@std/colors";
import * as asserts from "@std/asserts";

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
    router: Oak.Router;
    application: Oak.Application;
}

export class Server
{
    private secure: boolean;
    private domain: string;
    private routes: Map<string, string> = new Map<string, string>();

    private oak: OakServer;

    private __listener: Deno.Listener;
    private __listenerTls: Deno.Listener | undefined;

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

        const listenOptions: Deno.ListenOptions =
        {
            hostname: attributes.hostname,
            port: attributes.port as number
        };
        this.__listener = Deno.listen(listenOptions);

        if (this.secure)
        {
            const listenTlsOptions: Deno.ListenTlsOptions =
            {
                hostname: attributes.hostname,
                port: attributes.portTls as number,
                certFile: path.join(attributes.cert ?? "", "fullchain.pem"),
                keyFile: path.join(attributes.cert ?? "", "privkey.pem"),
                alpnProtocols: ["http/1.1", "h2"],
                transport: "tcp"
            };
            this.__listenerTls = Deno.listenTls(listenTlsOptions);
        }

        this.oak = { router: new Oak.Router(), application: new Oak.Application() };

        GraphQL.schema.path = attributes.schema;
        GraphQL.resolvers = attributes.resolvers;

        if (attributes.domain)
            this.domain = `${this.protocol}://${attributes.domain}`;
        else
            this.domain = `${this.protocol}://${this.hostname}:${this.port}`;

        this.graphqlQuery = this.graphqlQuery.bind(this);
        this.graphqlPlayground = this.graphqlPlayground.bind(this);

        this.content = this.content.bind(this);
        this.static = this.static.bind(this);
        this.react = this.react.bind(this);

        this.accept = this.accept.bind(this);
        this.acceptTls = this.acceptTls.bind(this);
    }
    private get listener(): Deno.Listener
    {
        return this.__listener;
    }
    private get listenerTls(): Deno.Listener
    {
        asserts.assert(this.secure);
        return this.__listenerTls!;
    }
    public get protocol(): "http" | "https"
    {
        return this.secure ? "https" : "http";
    }
    public get port(): number
    {
        const addr = this.secure ? this.listenerTls.addr : this.listener.addr;
        return (addr as Deno.NetAddr).port;
    }
    public get hostname(): string
    {
        const address = this.listener.addr as Deno.NetAddr;
        if ((["::1", "127.0.0.1"]).includes(address.hostname))
            return "localhost";
        return address.hostname;
    }
    public get url(): string
    {
        return `${this.protocol}://${this.hostname}:${this.port}`;
    }
    public get urlSimple(): string
    {
        return `${this.protocol}://${this.hostname}`;
    }
    private async graphqlQuery(context: Oak.Context): Promise<void>
    {
        await GraphQL.query(context);
    }
    private async graphqlPlayground(context: Oak.Context): Promise<void>
    {
        await GraphQL.playground(context);
    }
    private async content(context: Oak.Context): Promise<void>
    {
        /* Redirect HTTP to HTTPS if it's available. */
        if (!context.request.secure && this.secure)
        {
            const urlRequest = context.request.url;
            /* If the server is directly exposed to user-facing ports, then */
            /* send the user to `portTls`.                                  */
            if (urlRequest.port !== "80")
                context.response.redirect(`${this.url}${urlRequest.pathname}`);
            /* If the server is getting its ports redirected, then send the */
            /* user to 443 (default HTTPS port).                            */
            else
                context.response.redirect(`${this.urlSimple}${urlRequest.pathname}`);
            return;
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
            root: Deno.cwd(),
            hidden: true
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
                        <ReactRouter.StaticRouter location={context.request.url} context={staticContext}>
                            <this.App client={undefined} />
                        </ReactRouter.StaticRouter>
                    </div>
                </body>
            </html>;

        const body = `<!DOCTYPE html> ${await ReactDOMServer.renderToString(page)}`;

        if (staticContext.url)
            context.response.redirect(staticContext.url as string);

        context.response.status = staticContext.statusCode as Oak.Status ?? Oak.Status.OK;
        context.response.body = body;
    }
    private async accept(): Promise<void>
    {
        for await (const connection of this.listener)
        {
            try 
            {
                const events = Deno.serveHttp(connection);
                for await (const event of events)
                {
                    Console.log(event.request.url);
                    try 
                    {
                        const netconnection = connection as Deno.Conn<Deno.NetAddr>;
                        const response =
                            await this.oak.application.handle(event.request, netconnection, false);
                        if (response)
                            event.respondWith(response);
                    }
                    catch { /* */ }
                    Console.log(event.request.url);
                }
            }
            catch { /* */ }
        }
    }
    private async acceptTls(): Promise<void>
    {
        if (!this.secure)
            return;
        for await (const connection of this.listenerTls)
        {
            try 
            {
                const events = Deno.serveHttp(connection);
                for await (const event of events)
                {
                    try 
                    {
                        const netconnection = connection as Deno.Conn<Deno.NetAddr>;
                        const response =
                            await this.oak.application.handle(event.request, netconnection, true);
                        if (response)
                            event.respondWith(response);
                    }
                    catch { /* */ }
                }
            }
            catch { /* */ }
        }
    }
    public async serve(): Promise<void>
    {
        Console.log(`Building GraphQL...`);
        await GraphQL.build({ url: this.domain });

        Console.log(`Server is running on ${colors.underline(colors.magenta(this.url))}`);

        for (const [from, to] of this.routes)
            this.oak.router.redirect(from, to, Oak.Status.TemporaryRedirect);
        this.oak.router.post("/graphql", this.graphqlQuery);
        this.oak.router.get("/graphql", this.graphqlPlayground);
        this.oak.router.use(Oak.etag.factory());

        this.oak.application.use(this.oak.router.routes());
        this.oak.application.use(this.content);

        await Promise.all([this.accept(), this.acceptTls()]);
    }
    public close(): void
    {
        this.listener.close();
        if (this.secure)
            this.listenerTls.close();
    }
}