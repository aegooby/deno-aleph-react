
import * as colors from "@std/colors";
import * as fs from "@std/fs";
import * as async from "@std/async";
import * as yargs from "@yargs/yargs";
import { Arguments } from "@yargs/types";
import * as opener from "opener";

import { Console, version } from "../server/server.tsx";
export { version } from "../server/server.tsx";

Deno.env.set("DENO_DIR", ".cache/");
function createCommand(): [string[], string]
{
    const targetIndex = Deno.args.indexOf("--target");
    const targetValueIndex = targetIndex + 1;
    const defaultCommand =
        "deno run --unstable --import-map import-map.json --allow-all cli/cli.ts";
    if (targetIndex < 0 || targetValueIndex >= Deno.args.length)
        return [Deno.args, defaultCommand];
    const target = Deno.args[targetValueIndex];
    const args = Deno.args.slice(targetValueIndex + 1);
    switch (target)
    {
        case "windows":
            return [args, "build/windows.exe"];
        case "macos":
            return [args, "build/macos"];
        case "linux":
            return [args, "build/linux"];
        default:
            return [args, defaultCommand];
    }
}
export const [args, command] = createCommand();

export function all(_: Arguments)
{
    Console.error(`usage: ${command} <command> [options]`);
}
export async function clean(args: Arguments)
{
    if (!args.cache && !args.dist && !args.node)
        args.all = true;

    const directories: Array<string> = [];
    if (args.all || args.cache)
        directories.push(".cache/");
    if (args.all || args.dist)
        directories.push("dist/");
    if (args.all || args.node)
        directories.push("node_modules/");

    const rmRunOptions: Deno.RunOptions = { cmd: ["rm", "-rf", ...directories] };
    const rmProcess = Deno.run(rmRunOptions);
    const rmStatus = await rmProcess.status();
    rmProcess.close();
    if (!rmStatus.success)
        return rmStatus.code;

    const mkdirRunOptions: Deno.RunOptions =
        { cmd: ["mkdir", "-p", ...directories] };
    const mkdirProcess = Deno.run(mkdirRunOptions);
    const mkdirStatus = await mkdirProcess.status();
    mkdirProcess.close();
    return mkdirStatus.code;
}
export async function install(_: Arguments)
{
    const npmProcess = Deno.run({ cmd: ["npm", "install", "--global", "yarn"] });
    const npmStatus = await npmProcess.status();
    npmProcess.close();
    return npmStatus.code;
}
export async function upgrade(_: Arguments)
{
    const process = Deno.run({ cmd: ["deno", "upgrade"] });
    const status = await process.status();
    process.close();
    return status.code;
}
export async function cache(_: Arguments)
{
    const files: string[] = [];
    for await (const file of fs.expandGlob("**/*.tsx"))
        files.push(file.path);

    const denoRunOptions: Deno.RunOptions =
    {
        cmd: ["deno", "cache", "--unstable", "--import-map", "import-map.json", ...files],
        env: { DENO_DIR: ".cache/" }
    };
    const yarnRunOptions: Deno.RunOptions = { cmd: ["yarn", "install"] };

    const denoProcess = Deno.run(denoRunOptions);
    const yarnProcess = Deno.run(yarnRunOptions);

    const [denoStatus, yarnStatus] =
        await Promise.all([denoProcess.status(), yarnProcess.status()]);
    denoProcess.close();
    yarnProcess.close();

    if (!denoStatus.success)
        return denoStatus.code;
    if (!yarnStatus.success)
        return yarnStatus.code;
}
export async function bundle(args: Arguments)
{
    if (!args.graphql)
    {
        Console.error(`usage: ${command} bundle --graphql <endpoint>`);
        return;
    }

    if (await cache(args))
        throw new Error("Caching failed");

    const runOptions: Deno.RunOptions =
    {
        cmd: ["yarn", "run", "snowpack", "--config", "config/base.snowpack.js", "build"],
        env: { SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT: args.graphql }
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
export async function localhost(args: Arguments)
{
    if (!args.server)
    {
        Console.error(`usage: ${command} localhost --server <snowpack | deno>`);
        return;
    }

    switch (args.server)
    {
        case "snowpack":
            {
                const runOptions: Deno.RunOptions =
                {
                    cmd:
                        [
                            "yarn", "run", "snowpack", "--config",
                            "config/base.snowpack.js", "dev", "--secure"
                        ]
                };
                const process = Deno.run(runOptions);
                await process.status();
                process.close();
                return;
            }
        case "deno":
            {
                const snowpackRunOptions: Deno.RunOptions =
                {
                    cmd:
                        [
                            "yarn", "run", "snowpack", "--config",
                            "config/localhost.snowpack.js", "build"
                        ]
                };
                const snowpackProcess = Deno.run(snowpackRunOptions);
                const snowpackStatus = await snowpackProcess.status();
                snowpackProcess.close();
                if (!snowpackStatus.success)
                    return snowpackStatus.code;

                const browser = async function () 
                {
                    while (true)
                    {
                        try
                        {
                            await async.delay(750);
                            await fetch("http://localhost:8080/", { headers: { "x-http-only": "" } });
                            await opener.open("https://localhost:8443/");
                            return;
                        }
                        catch { undefined; }
                    }
                };
                Promise.race([browser(), async.delay(2500)]);

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
                const serverStatus = await serverProcess.status();
                serverProcess.close();
                return serverStatus.code;
            }
        default:
            Console.error(`usage: ${command} localhost --server <snowpack | deno>`);
            return;
    }
}
export async function remote(args: Arguments)
{
    if (await install(args))
        throw new Error("Installation failed");
    if (await cache(args))
        throw new Error("Caching failed");

    const snowpackRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "snowpack", "--config",
                "config/remote.snowpack.js", "build"
            ],
    };
    const snowpackProcess = Deno.run(snowpackRunOptions);
    const snowpackStatus = await snowpackProcess.status();
    snowpackProcess.close();
    if (!snowpackStatus.success)
        return snowpackStatus.code;

    const serverRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "deno", "run", "--unstable", "--allow-all",
                "--import-map", "import-map.json",
                "server/daemon.tsx", "--hostname", "0.0.0.0",
                "--tls", "cert/0.0.0.0"
            ],
        env: { DENO_DIR: ".cache/" }
    };
    const serverProcess = Deno.run(serverRunOptions);
    const serverStatus = await serverProcess.status();
    serverProcess.close();
    return serverStatus.code;
}
export async function test(_: Arguments)
{
    const runOptions: Deno.RunOptions =
    {
        cmd:
            [
                "deno", "test", "--unstable", "--allow-all",
                "--import-map", "import-map.json", "tests/"
            ],
        env: { DENO_DIR: ".cache/" }
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
export async function prune(_: Arguments)
{
    const containerProcess =
        Deno.run({ cmd: ["docker", "container", "prune", "--force"] });
    const containerStatus = await containerProcess.status();
    containerProcess.close();
    if (!containerStatus.success)
        return containerStatus.code;

    const imageProcess =
        Deno.run({ cmd: ["docker", "container", "prune", "--force"] });
    const imageStatus = await imageProcess.status();
    imageProcess.close();
    if (!imageStatus.success)
        return imageStatus.code;
}
export async function docker(args: Arguments)
{
    if (!args.target)
    {
        Console.error(`usage: ${command} docker --target <value>`);
        return;
    }

    if (args.prune)
        await prune(args);

    const buildRunOptions: Deno.RunOptions =
        { cmd: ["docker", "build", "--target", args.target, "--tag", "httpsaurus/server", "."] };
    const buildProcess = Deno.run(buildRunOptions);
    const buildStatus = await buildProcess.status();
    buildProcess.close();
    if (!buildStatus.success)
        return buildStatus.code;
}
export function help(_: Arguments)
{
    Console.log(`usage: ${command} <command> [options]`);
}

if (import.meta.main)
{
    yargs.default(args)
        .help(false)
        .command("*", "", {}, all)
        .command("version", "", {}, function (_: Arguments)
        {
            Console.log(`${colors.bold("https")}${colors.reset("aurus")} ${version.string()}`);
        })
        .command("clean", "", {}, clean)
        .command("install", "", {}, install)
        .command("upgrade", "", {}, upgrade)
        .command("cache", "", {}, cache)
        .command("bundle", "", {}, bundle)
        .command("localhost", "", {}, localhost)
        .command("remote", "", {}, remote)
        .command("test", "", {}, test)
        .command("prune", "", {}, prune)
        .command("docker", "", {}, docker)
        .command("help", "", {}, help)
        .parse();
}
