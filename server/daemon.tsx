
import * as React from "react";
import * as server from "./server.tsx";
import App from "../components/App.tsx";

import * as Oak from "oak";
import * as yargs from "@yargs/yargs";

import type { Resolvers } from "./types.d.tsx";

const args = yargs.default(Deno.args)
    .usage("usage: $0 server/daemon.tsx --hostname <host> [--domain <name>] [--tls <path>]")
    .hide("help")
    .hide("version")
    .hide("hostname")
    .demandOption([ "hostname" ])
    .parse();

try
{
    const resolvers: Resolvers<Oak.Context> =
    {
        Query:
        {
            request(_1: unknown, _2: unknown, context: Oak.Context)
            {
                return context.request.url.pathname;
            }
        }
    };
    const serverAttributes: server.ServerAttributes =
    {
        secure: !!args.tls,
        domain: args.domain,
        routes: {},
        hostname: args.hostname,
        port: 3080,

        portTls: 3443,
        cert: args.tls,

        App: <App client={undefined} />,
        headElements: [],

        customSchema: "graphql/custom.gql",
        schema: "graphql/schema.gql",
        resolvers: resolvers,
        dgraph: args.dgraph
    };
    const httpserver = new server.Server(serverAttributes);
    await httpserver.serve();
}
catch (error) { server.Console.error(error); }