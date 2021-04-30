
import * as path from "@std/path";
import * as fs from "@std/fs";
import * as colors from "@std/colors";
import * as async from "@std/async";

import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import * as ReactRouterServer from "react-router-dom/server";
import * as Oak from "oak";
import * as denoflate from "denoflate";

import { GraphQL } from "./graphql.tsx";
import { Console } from "./console.tsx";
export { Console } from "./console.tsx";

class Version
{
    public major: number;
    public minor: number;
    public patch: number;

    constructor(major: number, minor: number, patch: number)
    {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
    }
    public string()
    {
        return `v${this.major}.${this.minor}.${this.patch}`;
    }
}
export const version: Version = new Version(2, 1, 0);


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

interface ListenBaseOptions extends Deno.ListenOptions
{
    secure: false;
}
interface ListenTlsOptions extends Deno.ListenTlsOptions
{
    secure: true;
}
type ListenOptions = ListenBaseOptions | ListenTlsOptions;
type ConnectionAsyncIter =
    {
        [Symbol.asyncIterator](): AsyncGenerator<Deno.Conn, never, unknown>;
    };
class Listener 
{
    private nativeListeners: Map<number, [boolean, Deno.Listener]> = new Map<number, [boolean, Deno.Listener]>();
    private options: Array<ListenOptions> = [];

    constructor(options?: Array<ListenOptions>)
    {
        if (options) this.options = options;

        this.__listen = this.__listen.bind(this);
        this.listen = this.listen.bind(this);
        this.connections = this.connections.bind(this);
        this.secure = this.secure.bind(this);
        this.listener = this.listener.bind(this);
        this.keys = this.keys.bind(this);
        this.close = this.close.bind(this);
    }
    private __listen(options: ListenOptions): [boolean, Deno.Listener]
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
    public listen(options?: Array<ListenOptions>): Array<[boolean, Deno.Listener]>
    {
        if (!options)
            return this.options.map(this.__listen);
        else
            return options.map(this.__listen);
    }
    public connections(key: number): ConnectionAsyncIter
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
                    try 
                    {
                        const connection = await nativeListener.accept();
                        yield connection;
                    }
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
    public listener(key: number): Deno.Listener
    {
        if (!this.nativeListeners.has(key))
            throw new Error("Listener not found");
        const [_, native] = this.nativeListeners.get(key) as [boolean, Deno.Listener];
        return native;
    }
    public keys(): Array<number>
    {
        return Array.from(this.nativeListeners.keys());
    }
    public close(key?: number): void
    {
        if (key && this.nativeListeners.has(key))
        {
            const [_, listener] = this.nativeListeners.get(key) as [boolean, Deno.Listener];
            this.nativeListeners.delete(listener.rid);
            listener.close();
        }
        else
        {
            for (const [_1, [_2, listener]] of this.nativeListeners)
                listener.close();
            this.nativeListeners.clear();
        }
    }
}

enum StatusCode
{
    success = 0,
    failure = 1,
}

export class Server
{
    private secure: boolean;
    private domain: string;
    private routes: Map<string, string> = new Map<string, string>();

    private public: string = "/dist" as const;
    private scriptElements: Array<React.ReactElement> = [];

    private oak: Oak.Application;

    private listener: Listener;
    private hostname: string;
    private port: number;
    private portTls: number | undefined;

    private closed: async.Deferred<StatusCode> = async.deferred();

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

        const options: Array<ListenOptions> = [];
        const listenOptions: ListenBaseOptions =
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

        this.oak = new Oak.Application();

        this.graphql = new GraphQL(attributes);

        if (attributes.domain)
            this.domain = `${this.protocol}://${attributes.domain}`;
        else
            this.domain = `${this.protocol}://${this.hostname}:${this.port}`;

        this.router = this.router.bind(this);
        this.static = this.static.bind(this);
        this.react = this.react.bind(this);

        this.handle = this.handle.bind(this);
        this.accept = this.accept.bind(this);

        this.compress = this.compress.bind(this);
        this.scripts = this.scripts.bind(this);

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
    private async router(context: Oak.Context): Promise<void>
    {
        /** @todo CORS. */

        /* Redirect HTTP to HTTPS if it's available. */
        if (!context.request.secure && this.secure)
        {
            if (context.request.headers.has("x-http-only"))
            {
                context.response.status = Oak.Status.OK;
                context.response.body = "";
                return;
            }
            const urlRequest = context.request.url;
            const host = context.request.headers.get("host");
            context.response.redirect(`https://${host}${urlRequest.pathname}`);
            return;
        }

        /* Check reroutes */
        if (this.routes.has(context.request.url.pathname))
        {
            const from = context.request.url.pathname;
            const to = this.routes.get(from) as string;
            context.response.redirect(to);
            return;
        }

        /* Handle GraphQL */
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
                    context.response.status = Oak.Status.MethodNotAllowed;
                    context.response.body = "405 Method Not Allowed (GraphQL)";
                    return;
            }
        }

        /* Convert URL to filepath. */
        const filepath = path.join(".", this.public, context.request.url.pathname);

        /* File path not found or is not a file -> not static. */
        if (!await fs.exists(filepath) || !(await Deno.stat(filepath)).isFile)
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
            root: path.join(".", this.public)
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
                    {this.scriptElements}
                    <link rel="icon" href="/favicon.ico" />
                    <link rel="stylesheet" href="/index.css" />
                </head>
                <body>
                    <div id="root">
                        <ReactRouterServer.StaticRouter
                            location={context.request.url.pathname}
                            context={staticContext}
                        >
                            <this.App client={undefined} />
                        </ReactRouterServer.StaticRouter>
                    </div>
                </body>
            </html>;

        const render = Promise.resolve(ReactDOMServer.renderToString(page));
        const body = `<!DOCTYPE html> ${await render}`;

        if (staticContext.url)
        {
            context.response.redirect(staticContext.url as string);
            return;
        }

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
                    const request = event.request;
                    const response = await this.oak.handle(request, connection, secure);
                    if (response) await event.respondWith(response);
                }
                catch { undefined; }
            }
            try { httpConnection.close(); }
            catch { undefined; }
            try { connection.close(); }
            catch { undefined; }
        }
        catch { undefined; }
    }
    private async accept(key: number): Promise<StatusCode>
    {
        const secure = this.listener.secure(key);
        for await (const connection of this.listener.connections(key))
        {
            try { this.handle(connection, secure); }
            catch { undefined; }
        }
        return StatusCode.failure;
    }
    private async compress(): Promise<void>
    {
        const ext = [".js", ".map", ".txt", ".css"];
        const folder = path.join(".", this.public, "**", "*");
        for await (const file of fs.expandGlob(folder))
        {
            if ((await Deno.stat(file.path)).isFile && ext.includes(path.extname(file.path)))
            {
                const gunzipped = await Deno.readFile(file.path);
                const gzipped = denoflate.gzip(gunzipped, undefined);
                await Deno.writeFile(`${file.path}.gz`, gzipped);
            }
        }
    }
    private async scripts(): Promise<void>
    {
        const folder = path.join(".", this.public, "scripts", "webpack", "*.js");
        for await (const file of fs.expandGlob(folder))
        {
            const basename = path.basename(file.path);
            const [name, id, _] = basename.split(".", 3);
            if (name !== id)
                this.scriptElements.push(<script src={`/scripts/webpack/${basename}`} defer></script>);
        }
    }
    public async serve(): Promise<never>
    {
        Console.log(`${colors.bold("https")}${colors.reset("aurus")} ${version.string()}`);
        Console.log(`Building GraphQL...`);
        await this.graphql.build({ url: this.domain });
        Console.success(`GraphQL built`);

        Console.log(`Compressing static files...`);
        await this.compress();
        Console.success(`Static files compressed`);

        Console.log(`Collecting scripts...`);
        await this.scripts();
        Console.success(`Scripts collected`);

        this.oak.use(this.router);
        this.oak.use(Oak.etag.factory());

        const linkString = function (link: string)
        {
            return colors.underline(colors.magenta(link));
        };

        while (true)
        {
            try 
            {
                this.listener.listen();
                const keys = this.listener.keys();
                const promises = keys.map(this.accept);
                promises.push(this.closed);
                Console.success(`Server is running on ${linkString(this.url)}`);
                const status = await Promise.race(promises);
                Console.warn(`Restarting (status: ${status})`, Console.timestamp);
                this.close();
                this.closed = async.deferred();
            }
            catch (error)
            {
                Console.warn(`Restarting due to error ${Deno.inspect(error)}`, Console.timestamp);
                this.close();
                this.closed = async.deferred();
            }
        }
    }
    public close(): void
    {
        this.listener.close();
        this.closed.resolve(StatusCode.success);
    }
}
