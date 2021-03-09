
import * as Server from "./server.tsx";

import * as yargs from "https://deno.land/x/yargs/deno.ts";

const args = yargs.default(Deno.args)
    .usage("usage: $0 server/daemon.tsx --protocol <protocol> --hostname <host> --port <port> [--dev] [--help]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption(["protocol", "hostname", "port"])
    .parse();

const protocol: Server.Protocol = args.protocol;
const hostname: string = args.hostname;
const port: number = args.port;
const dev: boolean = args.dev;

try
{
    const serverAttributes =
    {
        protocol: protocol,
        hostname: hostname,
        port: port,
        dev: dev,
    };
    const server = new Server.Server(serverAttributes);
    await server.serve();
}
catch (error)
{
    Server.Console.error(error.toString());
    Deno.exit(1);
}