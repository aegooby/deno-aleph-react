
import * as fs from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import * as colors from "https://deno.land/std/fmt/colors.ts";

import { Console } from "./console.tsx";

interface BundlerAttributes
{
    entry: string;
    directory: string;
    tsconfig: Deno.CompilerOptions;
}

export class Bundler
{
    private entry: string;
    private directory: string;
    private tsconfig: Deno.CompilerOptions;
    private emitOptions: Deno.EmitOptions;
    private encoder: TextEncoder = new TextEncoder();
    constructor(attributes: BundlerAttributes)
    {
        this.entry = attributes.entry;
        this.directory = attributes.directory;
        this.tsconfig = attributes.tsconfig;
        this.emitOptions =
        {
            bundle: "esm",
            check: true,
            compilerOptions: this.tsconfig,
        };
    }
    private diagnostics(result: Deno.EmitResult)
    {
        for (const message of result.diagnostics)
        {
            const line = colors.yellow(message.start!.line.toString());
            const character = colors.yellow(message.start!.character.toString());
            const lines: string[] =
                [
                    `${colors.bold("Error")}: ${message.messageText!}\n        `,
                    `${message.sourceLine!.trim()}\n        `,
                    `${colors.red("~".repeat(message.sourceLine!.trim().length))}\n      `,
                    `at: ${colors.cyan(message.fileName!)}:${line}:${character}`
                ];
            Console.error(`${lines[0]}${lines[1]}${lines[2]}${lines[3]}`);
        }
        if (result.diagnostics.length)
            throw new Error("Bundling operation failed");
    }
    private async import(bundlePath: string)
    {
        const entry = `${bundlePath}.tsx`;

        const urlFile = `file://${path.resolve(entry)}`;
        Console.log(`Bundle import: ${colors.cyan(urlFile)}`);

        const result = await Deno.emit(entry, this.emitOptions);

        this.diagnostics(result);

        const array = this.encoder.encode(result.files["deno:///bundle.js"]);
        const outPath = path.join(this.directory, `${bundlePath}.bundle.js`);

        await fs.ensureDir(path.dirname(outPath));
        await Deno.writeFile(outPath, array);

        const stringFile = `"${outPath}"`;
        Console.success(`Emit: ${colors.magenta(stringFile)}`);
    }
    public async bundle(entry?: string)
    {
        if (entry)
        {
            Console.log(`Bundle entrypoint: ${colors.cyan(entry)}`);

            const result = await Deno.emit(entry, this.emitOptions);

            this.diagnostics(result);

            const text = result.files["deno:///bundle.js"];
            const array = this.encoder.encode(text);
            const outPath = path.join(this.directory, `${path.basename(entry)}.bundle.js`);
            await fs.ensureDir(path.dirname(outPath));
            await Deno.writeFile(outPath, array);

            const stringFile = `"${outPath}"`;
            Console.success(`Emit: ${colors.magenta(stringFile)}`);

            return;
        }

        const urlFile = `file://${path.resolve(this.entry)}`;
        Console.log(`Bundle entrypoint: ${colors.cyan(urlFile)}`);

        const result = await Deno.emit(this.entry, this.emitOptions);

        this.diagnostics(result);

        const text = result.files["deno:///bundle.js"];
        const regex =
            /import\s*?\((?:(?:".*\.bundle\.js")|(?:'.*\.bundle\.js')|(?:`.*\.bundle\.js`))\)/g;
        let matches: RegExpExecArray | null = regex.exec(text);
        while (matches)
        {
            for (const match of matches)
            {
                const bundlePath = match.split("\"")[1].split(".bundle.js")[0];
                await this.import(path.join(".", bundlePath));
            }
            matches = regex.exec(text);
        }
        const array = this.encoder.encode(text);
        const outPath = path.join(this.directory, "deno.bundle.js");
        await fs.ensureDir(path.dirname(outPath));
        await Deno.writeFile(outPath, array);

        const stringFile = `"${outPath}"`;
        Console.success(`Emit: ${colors.magenta(stringFile)}`);
    }
}
