
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import { Console } from "./console.tsx";

interface BundlerAttributes
{
    dist: string;
    watch: boolean;
}

export class Bundler
{
    private dist: string;
    private watch: boolean;
    constructor(attributes: BundlerAttributes)
    {
        this.dist = attributes.dist;
        this.watch = attributes.watch;
    }
    private async import(string: string)
    {
        if (string.endsWith(".prebuilt"))
            return;

        const entry = `${string}.tsx`;
        const output = path.join(this.dist, `${string}.bundle.js`);
        await this.__bundle(entry, output);
    }
    private async __bundle(entry: string, output: string)
    {
        if (!entry.length)
            throw new Error("Cannot bundle with empty entry path");

        /* Bundle the main file */
        await fs.ensureDir(path.dirname(output));
        const watch: string[] = this.watch ? ["--watch"] : [];
        const runOptions =
        {
            cmd:
                [
                    "deno", "bundle", "--unstable", ...watch, "--config",
                    "client/tsconfig.json", entry, output
                ]
        };
        const process = Deno.run(runOptions);
        const status = await process.status();
        process.close();
        if (!status.success)
            Deno.exit(status.code);

        /* Look for dynamic import() */
        const text = await Deno.readTextFile(output);
        const regex =
            /import\s*?\((?:(?:".*\.bundle\.js")|(?:'.*\.bundle\.js')|(?:`.*\.bundle\.js`))\)/g;
        const matchArrays = text.matchAll(regex);
        for (const matches of matchArrays)
        {
            for (const match of matches)
            {
                const bundlePath = match.split("\"")[1].split(".bundle.js")[0];
                this.import(bundlePath);
            }
        }
    }
    public async bundle(entry: string)
    {
        const output = path.join(this.dist, "deno.bundle.js");
        await this.__bundle(entry, output);
    }
}
