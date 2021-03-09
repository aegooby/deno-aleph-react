
import * as http from "https://deno.land/std/http/mod.ts";
import * as httpFile from "https://deno.land/std/http/file_server.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

export class Console
{
    static dev: boolean;
    static log(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.cyan("  [*]  ")) + message);
    }
    static success(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.green("  [$]  ")) + message);
    }
    static warn(message: string): void
    {
        console.warn(colors.bold(colors.yellow("  [?]  ")) + message);
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

    routes?: Map<string, string>;

    dev?: boolean;
}

export class Server
{
    #httpServer: http.Server;
    #protocol: Protocol;
    #routes: Map<string, string> = new Map<string, string>();
    #dev: boolean;

    constructor({ protocol, hostname, port, routes, dev = false }: ServerAttributes)
    {
        this.#protocol = protocol;
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
        switch (this.#protocol)
        {
            case "http":
                this.#httpServer = http.serve(serveOptions);
                break;
            case "https":
                this.#httpServer = http.serveTLS(serveTLSOptions);
                break;
            default:
                throw new Error("unknown server protocol (please choose HTTP or HTTPS)");
        }
        if (routes)
            this.#routes = routes;
        else
        {
            this.#routes.set("/", "/static/index.html");
            this.#routes.set("/favicon.ico", "/static/favicon.ico");
            this.#routes.set("/404.html", "/static/404.html");
            this.#routes.set("/robots.txt", "/static/robots.txt");
        }
        this.#dev = dev;
        Console.dev = this.#dev;
    }
    get port(): number
    {
        const address = this.#httpServer.listener.addr as Deno.NetAddr;
        return address.port;
    }
    get hostname(): string
    {
        const address = this.#httpServer.listener.addr as Deno.NetAddr;
        if ((["::1", "127.0.0.1"]).includes(address.hostname))
            return "localhost";
        return address.hostname;
    }
    get url(): string
    {
        return this.#protocol + "://" + this.hostname + ":" + this.port;
    }
    async file(request: http.ServerRequest): Promise<void>
    {
        try
        {
            const response = await httpFile.serveFile(request, request.url);
            await request.respond(response);
        }
        catch (error) { Console.error(error); }
    }
    async route(request: http.ServerRequest): Promise<void>
    {
        const originalURL = request.url;
        Console.success("Received " + request.method + " request: " + originalURL);
        if (this.#routes.has(request.url))
            request.url = this.#routes.get(request.url) as string;
        request.url = path.join(".", request.url);
        if (!await fs.exists(request.url))
        {
            Console.error("Route " + originalURL + " not found");
            request.url = "static/404.html";
        }
        await this.file(request);
    }
    async serve(): Promise<void>
    {
        const compilerOptions: Deno.CompilerOptions =
        {
            allowJs: true,
            checkJs: true,
            downlevelIteration: true,
            emitDeclarationOnly: false,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            experimentalDecorators: true,
            importHelpers: true,
            importsNotUsedAsValues: "remove",
            jsx: "react",
            jsxFactory: "React.createElement",
            jsxFragmentFactory: "React.Fragment",
            module: "esnext",
            noImplicitAny: true,
            sourceMap: true,
            lib:
                [
                    "deno.ns",
                    "deno.unstable",
                    "dom"
                ],
            strict: true,
            target: "esnext"
        };
        const emitOptions: Deno.EmitOptions =
        {
            bundle: "esm",
            check: true,
            compilerOptions: compilerOptions,
        };
        Console.log("Bundling client scripts...");
        const emit = await Deno.emit("client/bundle.tsx", emitOptions);
        if (emit.diagnostics.length)
            Console.warn(Deno.formatDiagnostics(emit.diagnostics));
        const encoder = new TextEncoder();
        const bundleSource = encoder.encode(emit.files["deno:///bundle.js"]);
        const bundleSourceMap = encoder.encode(emit.files["deno:///bundle.js.map"]);
        Deno.writeFile(".httpsaurus/bundle.js", bundleSource);
        Deno.writeFile(".httpsaurus/bundle.js.map", bundleSourceMap);
        Console.success("Bundled client scripts!");
        Console.log("Server is running on " + colors.underline(colors.magenta(this.url)));
        for await (const request of this.#httpServer)
            await this.route(request);
    }
    close(): void
    {
        this.#httpServer.close();
    }
}
