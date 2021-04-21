
import * as yargs from "@yargs/yargs";
import { Arguments } from "@yargs/types";
import * as colors from "@std/colors";
import * as fs from "@std/fs";

import { Console, Bundler } from "../server/server.tsx";

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
const [args, command] = createCommand();

function all(_: Arguments)
{
    Console.error(`usage: ${command} <command> [options]`);
}
function version(_: Arguments)
{
    Console.log(`${colors.bold("https")}${colors.reset("aurus")} v2.0.8`);
}
async function clean(args: Arguments)
{
    if (!args.cache && !args.dist && !args.node)
        args.all = true;
    const runOptions: Deno.RunOptions = { cmd: ["rm", "-rf"] };
    if (args.all || args.cache)
        runOptions.cmd.push(".cache/");
    if (args.all || args.dist)
        runOptions.cmd.push(".dist/");
    if (args.all || args.node)
        runOptions.cmd.push("node_modules/");

    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
async function install(_: Arguments)
{
    const npmProcess = Deno.run({ cmd: ["npm", "install", "--global", "yarn"] });
    const npmStatus = await npmProcess.status();
    npmProcess.close();
    return npmStatus.code;
}
async function upgrade(_: Arguments)
{
    const process = Deno.run({ cmd: ["deno", "upgrade"] });
    const status = await process.status();
    process.close();
    return status.code;
}
async function cache(_: Arguments)
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
async function bundle(args: Arguments)
{
    if (!args.graphql)
    {
        Console.error(`usage: ${command} bundle --graphql <endpoint>`);
        return;
    }

    if (await cache(args))
        throw new Error("Caching failed");

    const bundlerAttributes =
    {
        dist: ".dist",
        importMap: "import-map.json",
        env: { DENO_DIR: ".cache/" }
    };
    const bundler = new Bundler(bundlerAttributes);
    try { await bundler.bundle({ entry: "client/bundle.tsx", watch: false }); }
    catch (error) { throw error; }

    const runOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "webpack",
                "--env", `GRAPHQL_API_ENDPOINT=${args.graphql}`
            ]
    };
    const process = Deno.run(runOptions);
    const status = await process.status();
    process.close();
    return status.code;
}
async function localhost(_: Arguments)
{
    if (await install(_))
        throw new Error("Installation failed");
    if (await cache(_))
        throw new Error("Caching failed");

    const bundlerAttributes =
    {
        dist: ".dist",
        importMap: "import-map.json",
        env: { DENO_DIR: ".cache/" }
    };
    const bundler = new Bundler(bundlerAttributes);
    const webpackRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "webpack", "--env",
                "GRAPHQL_API_ENDPOINT=https://localhost:8443/graphql"
            ]
    };
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

    await bundler.bundle({ entry: "client/bundle.tsx", watch: false });

    const webpackProcess = Deno.run(webpackRunOptions);
    await webpackProcess.status();
    webpackProcess.close();

    const serverProcess = Deno.run(serverRunOptions);
    await serverProcess.status();
    serverProcess.close();
}
async function remote(args: Arguments)
{
    if (await install(args))
        throw new Error("Installation failed");
    if (await cache(args))
        throw new Error("Caching failed");

    const bundlerAttributes =
    {
        dist: ".dist",
        importMap: "import-map.json",
        env: { DENO_DIR: ".cache/" }
    };
    const bundler = new Bundler(bundlerAttributes);
    try { await bundler.bundle({ entry: "client/bundle.tsx", watch: false }); }
    catch (error) { throw error; }

    const webpackRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "yarn", "run", "webpack", "--env",
                "GRAPHQL_API_ENDPOINT=https://localhost/graphql"
            ],
    };
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

    const webpackProcess = Deno.run(webpackRunOptions);
    const webpackStatus = await webpackProcess.status();
    webpackProcess.close();
    if (!webpackStatus.success)
        return webpackStatus.code;

    /* Run server continuously to catch crashes. */
    while (true)
    {
        const serverProcess = Deno.run(serverRunOptions);
        await serverProcess.status();
        serverProcess.close();
    }
}
async function test(_: Arguments)
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
async function prune(_: Arguments)
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
async function docker(args: Arguments)
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
function help(_: Arguments)
{
    Console.log(`usage: ${command} <command> [options]`);
}

yargs.default(args)
    .help(false)
    .command("*", "", {}, all)
    .command("version", "", {}, version)
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
