
import * as path from "https://deno.land/std/path/mod.ts";

import * as console from "./console.tsx";

export class Bundler
{
    private compilerOptions: Deno.CompilerOptions;
    private emitOptions: Deno.EmitOptions;
    constructor()
    {
        this.compilerOptions =
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
            sourceMap: true,
            lib:
                [
                    "deno.ns",
                    "deno.unstable",
                    "dom"
                ],
            strict: true,
            target: "esnext"
        };
        this.emitOptions =
        {
            bundle: "esm",
            check: true,
            compilerOptions: this.compilerOptions,
        };
    }
    public async bundle(source: string, destDir: string)
    {
        const emit = await Deno.emit(source, this.emitOptions);
        if (emit.diagnostics.length)
            console.Console.warn(Deno.formatDiagnostics(emit.diagnostics));
        const encoder = new TextEncoder();
        const bundleSource = encoder.encode(emit.files["deno:///bundle.js"]);
        const bundleSourceMap = encoder.encode(emit.files["deno:///bundle.js.map"]);
        Deno.writeFile(path.join(destDir, "bundle.js"), bundleSource);
        Deno.writeFile(path.join(destDir, "bundle.js.map"), bundleSourceMap);
    }
}