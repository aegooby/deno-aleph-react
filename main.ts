
import * as Server from "./server/server.tsx";

const serverAttributes =
{
    port: 8000,
    directory: ".",
    html404: "static/404.html"
};

const server = new Server.Server(serverAttributes);
await server.serve();
