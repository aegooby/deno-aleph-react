
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

import { Console } from "./console.tsx";

interface BundlerAttributes
{
    dist: string;
    importMap?: string | undefined;
    env: Record<string, string>;
}
interface BundleAttributes
{
    entry: string;
    /** @todo Watch mode is buggy. */
    watch: boolean;
}

export class Bundler
{
    private dist: string = "" as const;
    private importMap: string | undefined = undefined;
    private env: Record<string, string> = {};
    private imports: Map<URL, string> = new Map<URL, string>();
    constructor(attributes: BundlerAttributes)
    {
        this.dist = attributes.dist;
        this.importMap = attributes.importMap;
        this.env = attributes.env;
    }
    private import(url: URL, watch: boolean): [string, Promise<void>]
    {
        switch (url.protocol)
        {
            case "file:":
                {
                    const entry = path.join(".", url.pathname);
                    const ext = path.extname(url.pathname);
                    const filename = `${url.pathname.split(ext)[0]}.bundle.js`;
                    const output = path.join(this.dist, filename);

                    return [path.toFileUrl(path.resolve(output)).href, this.__bundle(entry, output, watch)];
                }
            case "http:": case "https:":
                {
                    const entry = url.href;
                    const filename = `${path.basename(url.pathname)}.bundle.js`;
                    const output = path.join(this.dist, filename);

                    return [path.toFileUrl(path.resolve(output)).href, this.__bundle(entry, output, watch)];
                }
            default:
                throw new Error(`Unknown URL protocol in import(${url.href})`);
        }
    }
    private async __bundle(entry: string, output: string, watch: boolean)
    {
        if (!entry.length)
            throw new Error("Cannot bundle with empty entry path");

        /* Bundle the main file */
        await fs.ensureDir(path.dirname(output));
        const watchFlag: string[] = watch ? ["--watch"] : [];
        const importMapFlag: string[] = this.importMap ? ["--import-map", this.importMap] : [];
        const runOptions =
        {
            cmd:
                [
                    "deno", "bundle", "--unstable", ...watchFlag, ...importMapFlag,
                    "--config", "tsconfig.json", entry, output
                ],
            env: this.env
        };
        const process = Deno.run(runOptions);
        const status = await process.status();
        process.close();
        if (!status.success)
        {
            throw new Error(`Bundling subprocess failed with code ${status.code}`);
        }

        /* Look for dynamic import() */
        const text = await Deno.readTextFile(output);
        const regex =
            /import\s*?\((?:(?:"(.*)")|(?:'(.*)')|(?:`(.*)`))\)/g;

        const that = this as Bundler;
        const promises: Promise<void>[] = [];
        const textReplaced = text.replaceAll(regex, function (_, dquote, squote, bquote, _1, _2, _3) 
        {
            const importPath = dquote ?? squote ?? bquote;
            try
            {
                const url = new URL(importPath);
                if (!that.imports.has(url))
                {
                    const [filename, promise] = that.import(url, watch);
                    that.imports.set(url, filename);
                    promises.push(promise);
                }
                return `import("${that.imports.get(url)!}")`;
            }
            catch (error) 
            {
                Console.error(error);
                throw error;
            }
        });
        await Deno.writeTextFile(output, textReplaced);
        await Promise.all(promises);
    }
    public async bundle(attributes: BundleAttributes)
    {
        const output = path.join(this.dist, "deno.bundle.js");
        await this.__bundle(attributes.entry, output, attributes.watch);
    }
}
