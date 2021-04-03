
import * as yargs from "https://deno.land/x/yargs/deno.ts";
import { Arguments } from 'https://deno.land/x/yargs/deno-types.ts';
import * as colors from "https://deno.land/std/fmt/colors.ts";
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

import { Console, Bundler } from "./server/server.tsx";

Deno.env.set("DENO_DIR", ".cache/");

const tsconfig: Deno.CompilerOptions =
{
    allowJs: true,
    checkJs: true,
    downlevelIteration: true,
    emitDeclarationOnly: false,
    emitDecoratorMetadata: true,
    esModuleInterop: true,
    experimentalDecorators: true,
    importHelpers: true,
    importsNotUsedAsValues: "remove",
    jsx: "react",
    jsxFactory: "React.createElement",
    jsxFragmentFactory: "React.Fragment",
    module: "esnext",
    noImplicitAny: true,
    lib: ["deno.ns", "deno.unstable", "dom"],
    strict: true,
    target: "esnext"
};

const thisFile = path.basename(path.fromFileUrl(Deno.mainModule));
const command = `deno --unstable run --allow-all ${thisFile}`;

yargs.default(Deno.args)
    .help(false)
    .command("*", "", {}, function (_: Arguments)
    {
        Console.log(`usage: ${command} <command> [options]`);
        Deno.exit(1);
    })
    .command("version", "", {}, function (_: Arguments)
    {
        Console.log(`${colors.bold("https")}${colors.reset("aurus")} v1.1.2`);
    })
    .command("clean", "", {}, async function (args: Arguments)
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
        Deno.exit(status.code);
    })
    .command("install", "", {}, async function (_: Arguments)
    {
        const hashProcess = Deno.run({ cmd: ["hash", "yarn"] });
        const hashStatus = await hashProcess.status();
        hashProcess.close();
        if (hashStatus.success)
            Deno.exit(hashStatus.code);

        const npmProcess = Deno.run({ cmd: ["npm", "install", "--global", "yarn"] });
        const npmStatus = await npmProcess.status();
        npmProcess.close();
        Deno.exit(npmStatus.code);
    })
    .command("upgrade", "", {}, async function (_: Arguments)
    {
        const process = Deno.run({ cmd: ["deno", "upgrade"] });
        const status = await process.status();
        process.close();
        Deno.exit(status.code);
    })
    .command("cache", "", {}, async function (_: Arguments)
    {
        const files: string[] = [];
        for await (const file of fs.expandGlob("**/*.tsx"))
            files.push(file.path);

        const denoRunOptions: Deno.RunOptions =
        {
            cmd: ["deno", "--unstable", "cache", ...files],
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
            Deno.exit(denoStatus.code);
        if (!yarnStatus.success)
            Deno.exit(yarnStatus.code);
        Deno.exit();
    })
    .command("bundle", "", {}, async function (args: Arguments)
    {
        if (!args.graphql)
        {
            console.error(`usage: ${command} bundle --graphql <endpoint>`);
            Deno.exit(1);
        }

        const bundler = new Bundler({ dist: ".dist", watch: false });
        try { await bundler.bundle("client/bundle.tsx"); }
        catch (error) 
        {
            Console.error(error);
            Deno.exit(1);
        }

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
        Deno.exit(status.code);
    })
    .command("localhost", "", {}, async function (_: Arguments)
    {
        const bundler = new Bundler({ dist: ".dist", watch: true });
        const webpackRunOptions: Deno.RunOptions =
        {
            cmd:
                [
                    "yarn", "run", "webpack", "--watch", "--env",
                    "GRAPHQL_API_ENDPOINT=https://localhost:8443/graphql"
                ]
        };
        const serverRunOptions: Deno.RunOptions =
        {
            cmd:
                [
                    "deno", "run", "--unstable", "--watch", "--allow-all",
                    "server/daemon.tsx", "--hostname", "localhost", "--tls",
                    "cert/localhost/"
                ],
            env: { DENO_DIR: ".cache/" }
        };

        const bundle = bundler.bundle("client/bundle.tsx");
        const webpackProcess = Deno.run(webpackRunOptions);
        const serverProcess = Deno.run(serverRunOptions);

        await Promise.all([bundle, webpackProcess.status(), serverProcess.status()]);

        webpackProcess.close();
        serverProcess.close();
    })
    .command("remote", "", {}, function (_: Arguments)
    {
        console.error(`${colors.bold(colors.red("error"))}: TLS will not work without a certified domain`);
        Deno.exit(1);
    })
    .command("test", "", {}, async function (_: Arguments)
    {
        const process = Deno.run({ cmd: ["deno", "--unstable", "test", "--allow-all", "tests/"] });
        const status = await process.status();
        process.close();
        Deno.exit(status.code);
    })
    .command("docker", "", {}, async function (args: Arguments)
    {
        if (args.prune)
        {
            const containerProcess = Deno.run({ cmd: ["docker", "container", "prune", "--force"] });
            const containerStatus = await containerProcess.status();
            containerProcess.close();
            if (!containerStatus.success)
                Deno.exit(containerStatus.code);

            const imageProcess = Deno.run({ cmd: ["docker", "container", "prune", "--force"] });
            const imageStatus = await imageProcess.status();
            imageProcess.close();
            if (!imageStatus.success)
                Deno.exit(imageStatus.code);
        }

        const buildRunOptions: Deno.RunOptions =
            { cmd: ["docker", "build", "--tag", "httpsaurus/server", "."] };
        const buildProcess = Deno.run(buildRunOptions);
        const buildStatus = await buildProcess.status();
        buildProcess.close();
        if (!buildStatus.success)
            Deno.exit(buildStatus.code);

        const runRunOptions: Deno.RunOptions =
        {
            cmd:
                [
                    "docker", "run", "-it", "--init", "-p", "443:8443", "-p", "80:8080",
                    "httpsaurus/server:latest", "deno", ...command.split(" "), "remote"
                ]
        };

        const runProcess = Deno.run(runRunOptions);
        const runStatus = await runProcess.status();
        runProcess.close();
        if (!runStatus.success)
            Deno.exit(runStatus.code);

        Deno.exit();
    })
    .command("help", "", {}, function (_: Arguments)
    {
        Console.log(`usage: ${command} <command> [options]`);
        Deno.exit();
    })
    .parse();
