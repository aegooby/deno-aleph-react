
import * as httpsaurus from "../httpsaurus.ts";
import * as assert from "https://deno.land/std/testing/asserts.ts";
import * as delay from "https://deno.land/std/async/delay.ts";
try
{
    const tests: Deno.TestDefinition[] =
        [
            {
                name: ": run for 5 seconds (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes =
                    {
                        protocol: "http" as httpsaurus.Server.Protocol,
                        hostname: "localhost",
                        port: 8443,
                    };
                    const server = new httpsaurus.Server.Server(serverAttributes);
                    const time = delay.delay(5000);
                    const serve = server.serve();
                    await time;
                    server.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
                sanitizeExit: true,
            },
            {
                name: ": run for 5 seconds (HTTPS)",
                async fn(): Promise<void>
                {
                    const serverAttributes =
                    {
                        protocol: "https" as httpsaurus.Server.Protocol,
                        hostname: "localhost",
                        port: 8443,
                    };
                    const server = new httpsaurus.Server.Server(serverAttributes);
                    const time = delay.delay(5000);
                    const serve = server.serve();
                    await time;
                    server.close();
                    await serve;
                },
                sanitizeOps: false,
                sanitizeResources: false,
                sanitizeExit: true,
            },
            {
                name: ": fetch (HTTP)",
                async fn(): Promise<void>
                {
                    const serverAttributes =
                    {
                        protocol: "http" as httpsaurus.Server.Protocol,
                        hostname: "localhost",
                        port: 8443,
                    };
                    const server = new httpsaurus.Server.Server(serverAttributes);
                    const complete = server.serve();
                    const response = await fetch("http://localhost:8443/");
                    assert.assert(response.ok);
                    await response.text();
                    server.close();
                    await complete;
                },
                sanitizeOps: false,
                sanitizeResources: false,
                sanitizeExit: true,
            },
        ];
    for (const test of tests)
        Deno.test(test);
}
catch (error)
{
    httpsaurus.Server.Console.error(error.toString());
    Deno.exit(1);
}
