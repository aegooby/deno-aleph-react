
export class Console
{
    public static log(message: unknown): void
    {
        console.log("[*]", message);
    }
    public static success(message: unknown): void
    {
        console.log("[$]", message);
    }
    public static warn(message: unknown): void
    {
        console.warn("[?]", message);
    }
    public static error(message: unknown): void
    {
        console.error("[!]", message);
    }
}