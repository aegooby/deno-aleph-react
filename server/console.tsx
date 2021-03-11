
import * as colors from "https://deno.land/std/fmt/colors.ts";

export class Console
{
    public static dev: boolean;
    public static log(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.cyan("  [*]  ")) + message);
    }
    public static success(message: string): void
    {
        if (Console.dev)
            console.log(colors.bold(colors.green("  [$]  ")) + message);
    }
    public static warn(message: string): void
    {
        console.warn(colors.bold(colors.yellow("  [?]  ")) + message);
    }
    public static error(message: string): void
    {
        console.error(colors.bold(colors.red("  [!]  ")) + message);
    }
}