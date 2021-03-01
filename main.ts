
import * as yargs from "yargs";

import * as Server from "./server/server.tsx";

const args = yargs.default(Deno.args)
    .usage("usage: $0 main.ts --hostname <host> [--port <port>] [--help]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption(["protocol", "hostname", "port"])
    .parse();

const protocol: Server.Protocol = args.protocol;
const hostname: string = args.hostname;
const port: number = args.port;

try
{
    const serverAttributes =
    {
        protocol: protocol,
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
