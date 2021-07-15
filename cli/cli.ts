
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
            return [Deno.args, defaultCommand];
    }
}
export const [args, command] = createCommand();

export function all(_: Arguments)
{
    Console.error(`usage: ${command} <command> [options]`);
}
export async function clean(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} clean [--cache] [--dist] [--node]`);
        return;
    }
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
export async function install(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} install`);
        return;
    }
    const npmProcess = Deno.run({ cmd: ["npm", "install", "--global", "yarn"] });
    const npmStatus = await npmProcess.status();
    npmProcess.close();
    return npmStatus.code;
}
export async function upgrade(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} upgrade`);
        return;
    }
    const process = Deno.run({ cmd: ["deno", "upgrade"] });
    const status = await process.status();
    process.close();
    return status.code;
}
export async function cache(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} cache [--reload]`);
        return;
    }
    const files: string[] = [];
    for await (const file of fs.expandGlob("**/*.tsx"))
        files.push(file.path);

    const flags = args.reload ? ["--reload"] : [];
    const denoRunOptions: Deno.RunOptions =
    {
        cmd: ["deno", "cache", "--unstable", ...flags, "--import-map", "import-map.json", ...files],
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
    if (args.help)
    {
        Console.log(`usage: ${command} bundle --graphql <endpoint>`);
        return;
    }
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
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
export async function codegen(args: Arguments)
{
    if (args.help)
    {
        Console.error(`usage: ${command} codegen [--watch]`);
        return;
    }
    const watchArgs = args.watch ? ["--watch"] : [];
    const runOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "graphql-codegen", "--config",
                "config/codegen.json", ...watchArgs
            ],
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
export async function localhost(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} localhost --server <snowpack | deno>`);
        return;
    }
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
                            "config/localhost.snowpack.js", "--watch", "build"
                        ]
                };
                const snowpackProcess = Deno.run(snowpackRunOptions);
                const snowpackStatus = await snowpackProcess.status();
                snowpackProcess.close();
                if (!snowpackStatus.success)
                    return snowpackStatus.code;

                const ready = async function (): Promise<void>
                {
                    while (true)
                    {
                        try
                        {
                            await async.delay(750);
                            const init = { headers: { "x-http-only": "" } };
                            await fetch("http://localhost:3080/", init);
                            return;
                        }
                        catch { undefined; }
                    }
                };
                ready().then(async function () { await opener.open("https://localhost:3443/"); });

                const serverRunOptions: Deno.RunOptions =
                {
                    cmd:
                        [
                            "deno", "run", "--unstable", "--watch", "--allow-all",
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
export async function docker(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} docker --target <localhost | dev | live> --domain <domain>`);
        return;
    }
    if (!args.target || !(["localhost", "dev", "live"].includes(args.target)))
    {
        Console.error(`usage: ${command} docker --target <localhost | dev | live> --domain <domain>`);
        return;
    }

    if (await cache(args))
        throw new Error("Caching failed");

    const snowpackRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "snowpack", "--config",
                `config/docker-${args.target}.snowpack.js`, "build"
            ],
    };
    const snowpackProcess = Deno.run(snowpackRunOptions);
    const snowpackStatus = await snowpackProcess.status();
    snowpackProcess.close();
    if (!snowpackStatus.success)
        return snowpackStatus.code;

    const zero = async function (): Promise<void>
    {
        const zeroRunOptions: Deno.RunOptions = { cmd: ["dgraph", "zero"] };
        const zeroProcess = Deno.run(zeroRunOptions);
        await zeroProcess.status();
        zeroProcess.close();
    };
    const alpha = async function (): Promise<void>
    {
        const alphaRunOptions: Deno.RunOptions =
        {
            cmd:
                [
                    "dgraph", "alpha", "--cache", "size-mb=2048", "--limit",
                    "mutations=strict", "--zero", "localhost:5080",
                    "--security", "whitelist=0.0.0.0/0"
                ]
        };
        const alphaProcess = Deno.run(alphaRunOptions);
        await alphaProcess.status();
        alphaProcess.close();
    };
    const ratel = async function (): Promise<void>
    {
        const ratelRunOptions: Deno.RunOptions = { cmd: ["ratel"] };
        const ratelProcess = Deno.run(ratelRunOptions);
        await ratelProcess.status();
        ratelProcess.close();
    };
    const server = async function (): Promise<void>
    {
        /** @todo Add Deno TLS. */
        const serverRunOptions: Deno.RunOptions =
        {
            cmd:
                [
                    "deno", "run", "--unstable", "--allow-all",
                    "--import-map", "import-map.json",
                    "server/daemon.tsx", "--hostname", "0.0.0.0",
                    "--domain", args.domain, // "--tls", "cert/0.0.0.0"
                ],
            env: { DENO_DIR: ".cache/" }
        };
        const serverProcess = Deno.run(serverRunOptions);
        try { await serverProcess.status(); }
        catch { undefined; }
        serverProcess.close();
    };
    await Promise.race([server(), zero(), alpha(), ratel()]);
}
export async function test(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} test`);
        return;
    }
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
export async function prune(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} prune`);
        return;
    }
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
export async function image(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} image --target <value> --tag <name> [--prune]`);
        return;
    }
    if (!args.target || !args.tag)
    {
        Console.error(`usage: ${command} image --target <value> --tag <name> [--prune]`);
        return;
    }

    if (args.prune)
        await prune(args);

    const imageRunOptions: Deno.RunOptions =
        { cmd: ["docker", "build", "--target", args.target, "--tag", args.tag, "."] };
    const imageProcess = Deno.run(imageRunOptions);
    const imageStatus = await imageProcess.status();
    imageProcess.close();
    if (!imageStatus.success)
        return imageStatus.code;
}
export async function container(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} container --tag <name> [--prune]`);
        return;
    }
    if (!args.tag)
    {
        Console.error(`usage: ${command} container --tag <name> [--prune]`);
        return;
    }

    if (args.prune)
        await prune(args);

    const containerRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "docker", "run", "--init", "-itd",
                "-p", "80:3080", "-p", "5080:5080", "-p", "6080:6080",
                "-p", "8080:8080", "-p", "9080:9080", "-p", "8000:8000",
                "-v", "dgraph:/root/dgraph", `${args.tag}:latest`
            ]
    };
    const containerProcess = Deno.run(containerRunOptions);
    const containerStatus = await containerProcess.status();
    containerProcess.close();
    if (!containerStatus.success)
        return containerStatus.code;
}
export async function sync(args: Arguments)
{
    if (args.help)
    {
        Console.log(`usage: ${command} sync [--key <path>]`);
        return;
    }
    const file = await Deno.readFile("config/rsync.json");
    const decoder = new TextDecoder();
    const string = decoder.decode(file);
    const json = JSON.parse(string);

    const keyArgs = args.key ? ["-e", "ssh", "-i", `${args.key}`] : [];

    const runOptions: Deno.RunOptions =
    {
        cmd:
            [
                "rsync", "--progress", "--archive", "--relative", ...keyArgs,
                "--exclude", ".cache", "--exclude", "dist", "--exclude", ".git",
                "--exclude", "node_modules", "--exclude", ".env", `${json.src}`,
                `${args.user ?? json.user}@${args.host ?? json.host}:${json.dest}`
            ],
        env: { DENO_DIR: ".cache/" }
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    return status.code;
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
        .command("codegen", "", {}, codegen)
        .command("localhost", "", {}, localhost)
        .command("docker", "", {}, docker)
        .command("test", "", {}, test)
        .command("prune", "", {}, prune)
        .command("image", "", {}, image)
        .command("container", "", {}, container)
        .command("sync", "", {}, sync)
        .command("help", "", {}, help)
        .parse();
}
