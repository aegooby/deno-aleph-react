
import * as colors from "@std/colors";
import * as datetime from "@std/datetime";

export type Timestamp = true;

export class Console
{
    public static timestamp: Timestamp = true;
    private static time(): string
    {
        return datetime.format(new Date(), "MM-dd-yyyy hh:mm a");
    }
    public static log(message: unknown, timestamp?: Timestamp): void
    {
        const token = colors.bold(colors.cyan("[*]"));
        if (timestamp)
            console.log(token, colors.black(`(${this.time()})`), message);
        else
            console.log(token, message);
    }
    public static success(message: unknown, timestamp?: Timestamp): void
    {
        const token = colors.bold(colors.green("[$]"));
        if (timestamp)
            console.log(token, colors.black(`(${this.time()})`), message);
        else
            console.log(token, message);
    }
    public static warn(message: unknown, timestamp?: Timestamp): void
    {
        const token = colors.bold(colors.yellow("[?]"));
        if (timestamp)
            console.log(token, colors.black(`(${this.time()})`), message);
        else
            console.warn(token, message);
    }
    public static error(message: unknown, timestamp?: Timestamp): void
    {
        const token = colors.bold(colors.red("[!]"));
        if (timestamp)
            console.log(token, colors.black(`(${this.time()})`), message);
        else
            console.error(token, message);
    }
}