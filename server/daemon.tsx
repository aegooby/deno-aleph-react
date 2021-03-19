
import * as server from "./server.tsx";

import * as yargs from "https://deno.land/x/yargs/deno.ts";

const args = yargs.default(Deno.args)
    .usage("usage: $0 server/daemon.tsx --protocol <protocol> --hostname <host> --domain <domain> [--cert] [--help]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption(["protocol", "hostname", "domain"])
    .parse();

try
{
    const serverAttributes =
    {
        protocol: args.protocol,
        hostname: args.hostname,
        httpPort: 80,

        httpsPort: 443,
        cert: args.cert,

        domain: args.domain,

        schema: "graphql/schema.gql",
        resolvers: { request: function () { return "response"; } },
        routes:
        {
            "/favicon.ico": "/static/favicon.ico",
            "/404.html": "/static/404.html",
            "/robots.txt": "/static/robots.txt",
        }
    };
    const httpserver = new server.Server(serverAttributes);
    await httpserver.serve();
}
catch (error)
{
    server.Console.error(error.toString());
    Deno.exit(1);
}