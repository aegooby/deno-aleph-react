
import * as server from "../server/server.tsx";
import * as async from "@std/async";

try
{
    const tests: Deno.TestDefinition[] =
        [
            {
                name: ": run for 5 seconds (HTTP)",
                async fn(): Promise<void>
                {
                    console.log("");
                    const serverRunOptions: Deno.RunOptions =
                    {
                        cmd:
                            [
                                "deno", "run", "--unstable", "--allow-all",
                                "--import-map", "import-map.json", "server/daemon.tsx",
                                "--hostname", "localhost"
                            ],
                        env: { DENO_DIR: ".cache/" }
                    };
                    const serverProcess = Deno.run(serverRunOptions);
                    const time = async.delay(5000);
                    const status = serverProcess.status();
                    await time;
                    serverProcess.close();
                    serverProcess.kill(Deno.Signal.SIGKILL);
                    await status;
                },
                sanitizeOps: false,
                sanitizeResources: false,
            },
            {
                name: ": run for 5 seconds (HTTPS)",
                async fn(): Promise<void>
                {
                    console.log("");
                    const serverRunOptions: Deno.RunOptions =
                    {
                        cmd:
                            [
                                "deno", "run", "--unstable", "--allow-all",
                                "--import-map", "import-map.json", "server/daemon.tsx",
                                "--hostname", "localhost", "--tls", "cert/localhost/"
                            ],
                        env: { DENO_DIR: ".cache/" }
                    };
                    const serverProcess = Deno.run(serverRunOptions);
                    const time = async.delay(5000);
                    const status = serverProcess.status();
                    await time;
                    serverProcess.close();
                    serverProcess.kill(Deno.Signal.SIGKILL);
                    await status;
                },
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
