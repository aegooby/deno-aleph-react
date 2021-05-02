
import * as colors from "@std/colors";
import * as datetime from "@std/datetime";

export interface ConsoleAttributes
{
    time?: true;
    clear?: true;
}

type ConsoleFunction = (...data: unknown[]) => void;

export class Console
{
    private static timestamp(): string
    {
        return datetime.format(new Date(), "MM-dd-yyyy hh:mm a");
    }
    private static write(stream: ConsoleFunction, token: string, message: unknown, attributes?: ConsoleAttributes): void
    {
        const time = attributes?.time ? colors.black(`(${this.timestamp()})`) : undefined;
        const value = typeof message === "string" ? message as string : Deno.inspect(message);
        time ? stream(token, time, value) : stream(token, value);
    }
    public static log(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.cyan("[*]"));
        this.write(console.log, token, message, attributes);
    }
    public static success(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.green("[$]"));
        this.write(console.info, token, message, attributes);
    }
    public static warn(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.yellow("[?]"));
        this.write(console.warn, token, message, attributes);
    }
    public static error(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.red("[!]"));
        this.write(console.error, token, message, attributes);
    }
}