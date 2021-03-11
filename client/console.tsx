
export class Console
{
    public static log(message: string): void
    {
        console.log("  [*]  " + message);
    }
    public static success(message: string): void
    {
        console.log("  [$]  " + message);
    }
    public static warn(message: string): void
    {
        console.warn("  [?]  " + message);
    }
    public static error(message: string): void
    {
        console.error("  [!]  " + message);
    }
}