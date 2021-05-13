
import * as React from "react";
import * as server from "./server.tsx";
import App from "../components/App.tsx";

import * as yargs from "@yargs/yargs";

const args = yargs.default(Deno.args)
    .usage("usage: $0 server/daemon.tsx --hostname <host> [--domain <name>] [--tls <path>]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption(["hostname"])
    .parse();

try
{
    const serverAttributes: server.ServerAttributes =
    {
        secure: !!args.tls,
        domain: args.domain,
        routes: {},
        hostname: args.hostname,
        port: 8080,

        portTls: 8443,
        cert: args.tls,

        App: <App client={undefined} />,
        headElements: [],

        schema: "graphql/schema.gql",
        resolvers: { request: function () { return "response"; } },
    };
    const httpserver = new server.Server(serverAttributes);
    await httpserver.serve();
}
catch (error) { server.Console.error(error); }