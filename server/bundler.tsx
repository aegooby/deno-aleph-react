
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

interface BundlerAttributes
{
    dist: string;
    env: Record<string, string>;
}
interface BundleAttributes
{
    entry: string;
    watch: boolean;
}

export class Bundler
{
    private dist: string = "" as const;
    private env: Record<string, string> = {};
    private imports: Set<string> = new Set<string>();
    constructor(attributes: BundlerAttributes)
    {
        this.dist = attributes.dist;
        this.env = attributes.env;
    }
    private async import(string: string, watch: boolean)
    {
        if (string.endsWith(".prebuilt"))
            return;

        const entry = `${string}.tsx`;
        const output = path.join(this.dist, `${string}.bundle.js`);
        await this.__bundle(entry, output, watch);
    }
    private async __bundle(entry: string, output: string, watch: boolean)
    {
        if (!entry.length)
            throw new Error("Cannot bundle with empty entry path");

        /* Bundle the main file */
        await fs.ensureDir(path.dirname(output));
        const watchFlag: string[] = watch ? ["--watch"] : [];
        const runOptions =
        {
            cmd:
                [
                    "deno", "bundle", "--unstable", ...watchFlag, "--config",
                    "tsconfig.json", entry, output
                ],
            env: this.env
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
                this.imports.add(bundlePath);
                if (!this.imports.has(bundlePath))
                    this.import(bundlePath, watch);
            }
        }
    }
    public async bundle(attributes: BundleAttributes)
    {
        try
        {
            const url = new URL(attributes.entry);
            if (url.protocol === "file:")
                throw new Error();
            const output = path.join(this.dist, `${path.basename(url.pathname)}.prebuilt.bundle.js`);
            await this.__bundle(attributes.entry, output, attributes.watch);
        }
        catch
        {
            const output = path.join(this.dist, "deno.bundle.js");
            await this.__bundle(attributes.entry, output, attributes.watch);
        }
    }
}
