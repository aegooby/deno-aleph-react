
import * as Server from "./server/server.tsx";

const serverAttributes =
{
    port: 443,
    directory: ".",
    html404: "static/404.html"
};

try
{
    const server = new Server.Server(serverAttributes);
    await server.serve();
}
catch (error)
{
    Server.Console.error(error.toString());
    Deno.exit(1);
}
