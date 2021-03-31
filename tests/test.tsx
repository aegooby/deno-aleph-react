
import * as httpsaurus from "../httpsaurus.ts";
import * as assert from "https://deno.land/std/testing/asserts.ts";
import * as delay from "https://deno.land/std/async/delay.ts";

import App from "../components/App.tsx";

try
{
    const tests: Deno.TestDefinition[] =
        [
            {
                name: ": run for 5 seconds (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes: httpsaurus.server.ServerAttributes =
                    {
                        protocol: "http" as httpsaurus.server.Protocol,
                        domain: undefined,
                        hostname: "localhost",
                        httpPort: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        httpsPort: undefined,
                        cert: undefined,

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const server = new httpsaurus.server.Server(serverAttributes);
                    const time = delay.delay(5000);
                    const serve = server.serve();
                    await time;
                    server.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
            {
                name: ": run for 5 seconds (HTTPS)",
                async fn(): Promise<void>
                {
                    const serverAttributes: httpsaurus.server.ServerAttributes =
                    {
                        protocol: "https" as httpsaurus.server.Protocol,
                        domain: undefined,
                        hostname: "localhost",
                        httpPort: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        httpsPort: 4430,
                        cert: "cert/localhost",

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const server = new httpsaurus.server.Server(serverAttributes);
                    const time = delay.delay(5000);
                    const serve = server.serve();
                    await time;
                    server.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
            {
                name: ": fetch (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes: httpsaurus.server.ServerAttributes =
                    {
                        protocol: "http" as httpsaurus.server.Protocol,
                        domain: undefined,
                        hostname: "localhost",
                        httpPort: 8080,
                        routes:
                        {
                            "/favicon.ico": "/static/favicon.ico",
                            "/robots.txt": "/static/robots.txt",
                        },

                        httpsPort: undefined,
                        cert: undefined,

                        App: App,

                        schema: "graphql/schema.gql",
                        resolvers: { request: function () { return "response"; } },
                    };
                    const server = new httpsaurus.server.Server(serverAttributes);
                    const complete = server.serve();
                    const response = await fetch("http://localhost:8080/");
                    assert.assert(response.ok);
                    await response.text();
                    server.close();
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
    httpsaurus.server.Console.error(error.toString());
    Deno.exit(1);
}
