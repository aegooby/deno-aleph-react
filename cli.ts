
import * as yargs from "https://deno.land/x/yargs/deno.ts";
import { Arguments } from 'https://deno.land/x/yargs/deno-types.ts';
import * as colors from "https://deno.land/std/fmt/colors.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

Deno.env.set("DENO_DIR", ".cache/");
const { Console, Bundler } = await import("./server/server.tsx");

const thisFile = path.basename(path.fromFileUrl(Deno.mainModule));
const command = `deno run --unstable --import-map import-map.json --allow-all ${thisFile}`;

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
async function test(_: Arguments)
{
    const process =
        Deno.run({ cmd: ["deno", "test", "--unstable", "--allow-all", "--import-map", "import-map.json", "tests/"] });
    const status = await process.status();
    process.close();
    return status.code;
}
async function docker(args: Arguments)
{
    if (args.prune)
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

    const buildRunOptions: Deno.RunOptions =
        { cmd: ["docker", "build", "--tag", "httpsaurus/server", "."] };
    const buildProcess = Deno.run(buildRunOptions);
    const buildStatus = await buildProcess.status();
    buildProcess.close();
    if (!buildStatus.success)
        return buildStatus.code;

    const devFlag: string[] = args.dev ? ["--dev"] : [];

    const runRunOptions: Deno.RunOptions =
    {
        cmd:
            [
                "docker", "run", "-itd", "--init", "-p", "443:8443", "-p",
                "80:8080", "httpsaurus/server:latest", ...command.split(" "),
                "remote", ...devFlag
            ]
    };

    const runProcess = Deno.run(runRunOptions);
    const runStatus = await runProcess.status();
    runProcess.close();
    if (!runStatus.success)
        return runStatus.code;
}

yargs.default(Deno.args)
    .help(false)
    .command("*", "", {}, function (_: Arguments)
    {
        Console.error(`usage: ${command} <command> [options]`);
    })
    .command("version", "", {}, function (_: Arguments)
    {
        Console.log(`${colors.bold("https")}${colors.reset("aurus")} v1.1.2`);
    })
    .command("clean", "", {}, clean)
    .command("install", "", {}, install)
    .command("upgrade", "", {}, upgrade)
    .command("cache", "", {}, cache)
    .command("bundle", "", {}, bundle)
    .command("localhost", "", {}, localhost)
    .command("remote", "", {}, function (_: Arguments)
    {
        Console.error("TLS will not work without a certified domain");
    })
    .command("test", "", {}, test)
    .command("docker", "", {}, docker)
    .command("help", "", {}, function (_: Arguments)
    {
        Console.log(`usage: ${command} <command> [options]`);
    })
    .parse();