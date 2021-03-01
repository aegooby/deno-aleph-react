
import * as yargs from "https://deno.land/x/yargs/deno.ts";

import * as Server from "./server/server.tsx";

const args = yargs.default(Deno.args)
    .usage("usage: $0 main.ts --hostname <host> [--port <port>] [--help]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption(["hostname"])
    .parse();

const hostname = args.hostname ? args.hostname : "localhost";
const port = args.port ? args.port : 8443;

try
{
    const serverAttributes =
    {
        hostname: hostname,
        port: port,
        directory: ".",
        html404: "static/404.html"
    };
    const server = new Server.Server(serverAttributes);
    await server.serve();
}
catch (error)
{
    Server.Console.error(error.toString());
    Deno.exit(1);
}
