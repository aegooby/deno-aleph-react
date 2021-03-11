
import * as colors from "https://deno.land/std/fmt/colors.ts";

export class Console
{
    static dev: boolean;
    static log(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.cyan("  [*]  ")) + message);
    }
    static success(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.green("  [$]  ")) + message);
    }
    static warn(message: string): void
    {
        console.warn(colors.bold(colors.yellow("  [?]  ")) + message);
    }
    static error(message: string): void
    {
        console.error(colors.bold(colors.red("  [!]  ")) + message);
    }
}