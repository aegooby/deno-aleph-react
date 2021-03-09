
import * as httpsaurus from "../httpsaurus.ts";
import * as delay from "https://deno.land/std/async/delay.ts";

async function runServer()
{
    const delayPromise = delay.delay(10000);
    try
    {
        const serverAttributes =
        {
            protocol: "https" as httpsaurus.Server.Protocol,
            hostname: "localhost",
            port: 8443,
        };
        const server = new httpsaurus.Server.Server(serverAttributes);
        server.serve();
    }
    catch (error)
    {
        httpsaurus.Server.Console.error(error.toString());
        Deno.exit(1);
    }
    await delayPromise;
    return;
}

const tests: Deno.TestDefinition[] =
    [
        {
            name: "Run Server",
            fn: runServer,
            sanitizeOps: false,
            sanitizeResources: false,
            sanitizeExit: true,
        }
    ];
for (const test of tests)
    Deno.test(test);