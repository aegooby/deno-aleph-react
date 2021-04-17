
import * as server from "../server/server.tsx";
import * as assert from "@std/asserts";
import * as async from "@std/async";

import App from "../components/App.tsx";

try
{
    const tests: Deno.TestDefinition[] =
        [
            {
                name: ": run for 5 seconds (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes: server.ServerAttributes =
                    {
                        secure: false,
                        domain: undefined,
                        hostname: "localhost",
                        port: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        portTls: undefined,
                        cert: undefined,

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const httpserver = new server.Server(serverAttributes);
                    const time = async.delay(5000);
                    const serve = httpserver.serve();
                    await time;
                    httpserver.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
            {
                name: ": run for 5 seconds (HTTPS)",
                async fn(): Promise<void>
                {
                    const serverAttributes: server.ServerAttributes =
                    {
                        secure: true,
                        domain: undefined,
                        hostname: "localhost",
                        port: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        portTls: 4430,
                        cert: "cert/localhost",

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const httpserver = new server.Server(serverAttributes);
                    const time = async.delay(5000);
                    const serve = httpserver.serve();
                    await time;
                    httpserver.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
            {
                name: ": fetch (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes: server.ServerAttributes =
                    {
                        secure: false,
                        domain: undefined,
                        hostname: "localhost",
                        port: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        portTls: undefined,
                        cert: undefined,

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const httpserver = new server.Server(serverAttributes);
                    const complete = httpserver.serve();
                    const response = await fetch("http://localhost:8080/");
                    assert.assert(response.ok);
                    await response.text();
                    httpserver.close();
                    await complete;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
        ];
    for (const test of tests)
        Deno.test(test);
}
catch (error)
{
    server.Console.error(error.toString());
    Deno.exit(1);
}
