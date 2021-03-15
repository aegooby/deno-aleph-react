
import * as colors from "https://deno.land/std/fmt/colors.ts";

export class Console
{
    public static log(message: unknown): void
    {
        console.log(colors.bold(colors.cyan("  [*]  ")) + message);
    }
    public static success(message: unknown): void
    {
        console.log(colors.bold(colors.green("  [$]  ")) + message);
    }
    public static warn(message: unknown): void
    {
        console.warn(colors.bold(colors.yellow("  [?]  ")) + message);
    }
    public static error(message: unknown): void
    {
        console.error(colors.bold(colors.red("  [!]  ")) + message);
    }
}