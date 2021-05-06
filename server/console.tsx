
import * as colors from "@std/colors";
import * as datetime from "@std/datetime";

export interface ConsoleAttributes
{
    time?: true;
    clear?: true;
}

type Stream = Deno.Writer & Deno.WriterSync & Deno.Closer & { readonly rid: number; };
type StreamFunction = (...data: unknown[]) => void;

const streams: [number, StreamFunction][] =
    [[Deno.stdout.rid, console.log], [Deno.stderr.rid, console.error]];

export class Console
{
    private static streams: Map<number, StreamFunction> =
        new Map<number, StreamFunction>(streams);
    private static encoder: TextEncoder = new TextEncoder();
    private static timestamp(): string
    {
        return datetime.format(new Date(), "MM-dd-yyyy hh:mm a");
    }
    public static clear(stream: Stream, lines?: number)
    {
        if (lines)
        {
            for (let i = 0; i < lines; i++)
                stream.writeSync(this.encoder.encode("\x1b[A\x1b[K"));
        }
        else
            stream.writeSync(this.encoder.encode("\x1b[1J"));
    }
    private static write(stream: Stream, token: string, message: unknown, attributes?: ConsoleAttributes): void
    {
        const time = attributes?.time ? colors.black(`(${this.timestamp()})`) : undefined;
        const value = typeof message === "string" ? message as string : Deno.inspect(message);
        if (attributes?.clear)
            stream.writeSync(this.encoder.encode("\x1b[A\x1b[K"));
        const streamfn = this.streams.get(stream.rid) as StreamFunction;
        time ? streamfn(token, time, value) : streamfn(token, value);
    }
    public static log(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.cyan("[*]"));
        this.write(Deno.stdout, token, message, attributes);
    }
    public static success(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.green("[$]"));
        this.write(Deno.stdout, token, message, attributes);
    }
    public static warn(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.yellow("[?]"));
        this.write(Deno.stderr, token, message, attributes);
    }
    public static error(message: unknown, attributes?: ConsoleAttributes): void
    {
        const token = colors.bold(colors.red("[!]"));
        this.write(Deno.stderr, token, message, attributes);
    }
}