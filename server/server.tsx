
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
    router: Oak.Router;
    app: Oak.Application;
}

interface ListenOptions extends Deno.ListenOptions
{
    secure: false;
}
interface ListenTlsOptions extends Deno.ListenTlsOptions
{
    secure: true;
}
type ListenOptionsEither = ListenOptions | ListenTlsOptions;
class Listener 
{
    private nativeListeners: Map<number, [boolean, Deno.Listener]> = new Map<number, [boolean, Deno.Listener]>();
    private options: Array<ListenOptionsEither> = [];

    constructor(options?: Array<ListenOptionsEither>)
    {
        if (options) this.options = options;

        this.__listen = this.__listen.bind(this);
        this.listen = this.listen.bind(this);
        this.accept = this.accept.bind(this);
    }
    private __listen(options: ListenOptionsEither): [boolean, Deno.Listener]
    {
        if (options.secure)
        {
            const listener = Deno.listenTls(options as Deno.ListenTlsOptions);
            this.nativeListeners.set(listener.rid, [options.secure, listener]);
            return [options.secure, listener];
        }
        else
        {
            const listener = Deno.listen(options as Deno.ListenOptions);
            this.nativeListeners.set(listener.rid, [options.secure, listener]);
            return [options.secure, listener];
        }
    }
    public listen(options?: Array<ListenOptionsEither>): Array<[boolean, Deno.Listener]>
    {
        if (!options)
            return this.options.map(this.__listen);
        else
            return options.map(this.__listen);
    }
    public accept(key: number)
    {
        if (!this.nativeListeners.has(key))
            throw new Error("Listener not found");
        const [_, nativeListener] = this.nativeListeners.get(key) as [boolean, Deno.Listener];
        const iterable =
        {
            async *[Symbol.asyncIterator]()
            {
                while (true)
                {
                    try { yield await nativeListener.accept(); }
                    catch { undefined; }
                }
            }
        };
        return iterable;
    }
    public secure(key: number): boolean
    {
        if (!this.nativeListeners.has(key))
            throw new Error("Listener not found");
        const [secure, _] = this.nativeListeners.get(key) as [boolean, Deno.Listener];
        return secure;
    }
    public keys(): Array<number>
    {
        const array: Array<number> = [];
        for (const key of this.nativeListeners.keys())
            array.push(key);
        return array;
    }
    public close(key?: number): void
    {
        if (key && this.nativeListeners.has(key))
        {
            const [_, listener] = this.nativeListeners.get(key) as [boolean, Deno.Listener];
            listener.close();
        }
        else
        {
            for (const [_1, [_2, listener]] of this.nativeListeners)
                listener.close();
        }
    }
}

export class Server
{
    private secure: boolean;
    private domain: string;
    private routes: Map<string, string> = new Map<string, string>();

    private oak: OakServer;

    private listener: Listener;
    private hostname: string;
    private port: number;
    private portTls: number | undefined;

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

        this.hostname = attributes.hostname;
        this.port = attributes.port;
        this.portTls = this.secure ? attributes.portTls : undefined;

        const options: Array<ListenOptionsEither> = [];
        const listenOptions: ListenOptions =
        {
            hostname: attributes.hostname,
            port: attributes.port as number,
            secure: false
        };
        options.push(listenOptions);

        if (this.secure)
        {
            const listenTlsOptions: ListenTlsOptions =
            {
                hostname: attributes.hostname,
                port: attributes.portTls as number,
                certFile: path.join(attributes.cert ?? "", "fullchain.pem"),
                keyFile: path.join(attributes.cert ?? "", "privkey.pem"),
                alpnProtocols: ["http/1.1", "h2"],
                transport: "tcp",
                secure: true,
            };
            options.push(listenTlsOptions);
        }
        this.listener = new Listener(options);

        this.oak = { router: new Oak.Router(), app: new Oak.Application() };

        this.graphql = new GraphQL(attributes);

        if (attributes.domain)
            this.domain = `${this.protocol}://${attributes.domain}`;
        else
            this.domain = `${this.protocol}://${this.hostname}:${this.port}`;

        this.content = this.content.bind(this);
        this.static = this.static.bind(this);
        this.react = this.react.bind(this);

        this.listen = this.listen.bind(this);
        this.accept = this.accept.bind(this);

        this.serve = this.serve.bind(this);
        this.close = this.close.bind(this);
    }
    public get protocol(): "http" | "https"
    {
        return this.secure ? "https" : "http";
    }
    public get url(): string
    {
        return `${this.protocol}://${this.hostname}:${this.portTls ?? this.port}`;
    }
    public get urlSimple(): string
    {
        return `${this.protocol}://${this.hostname}`;
    }
    private async content(context: Oak.Context): Promise<void>
    {
        /* Redirect HTTP to HTTPS if it's available. */
        if (!context.request.secure && this.secure)
        {
            const urlRequest = context.request.url;
            const host = context.request.headers.get("host");
            context.response.redirect(`https://${host}${urlRequest.pathname}`);
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
    private async handle(connection: Deno.Conn, secure: boolean): Promise<void>
    {
        try
        {
            const httpConnection = Deno.serveHttp(connection);
            for await (const event of httpConnection)
            {
                try 
                {
                    const response =
                        await this.oak.app.handle(event.request, connection, secure);
                    if (response)
                        await event.respondWith(response);
                }
                catch { undefined; }
            }
        }
        catch { undefined; }
    }
    private async accept(key: number): Promise<void>
    {
        const secure = this.listener.secure(key);
        for await (const connection of this.listener.accept(key))
        {
            try { this.handle(connection, secure); }
            catch { undefined; }
        }
    }
    private async listen(): Promise<void>
    {
        const keys = this.listener.keys();
        const promises = keys.map(this.accept);
        await Promise.all(promises);
    }
    public async serve(): Promise<void>
    {
        Console.log(`Building GraphQL...`);
        await this.graphql.build({ url: this.domain });

        this.listener.listen();

        for (const [from, to] of this.routes)
            this.oak.router.redirect(from, to, Oak.Status.TemporaryRedirect);
        this.oak.router.post("/graphql", this.graphql.query);
        this.oak.router.get("/graphql", this.graphql.playground);
        this.oak.router.use(Oak.etag.factory());

        this.oak.app.use(this.oak.router.routes());
        this.oak.app.use(this.content);

        Console.log(`Server is running on ${colors.underline(colors.magenta(this.url))}`);

        await Promise.race([this.listen(), this.closed]);
    }
    public close(): void
    {
        this.listener.close();
    }
}
