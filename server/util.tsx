
import * as Oak from "oak";

export async function proxy(address: string, context: Oak.Context, next?: () => Promise<unknown>)
{
    const request = context.request.originalRequest as Oak.NativeRequest;
    const requestInit: RequestInit =
    {
        body: request.body,
        method: request.method,
        headers: request.headers,
    };
    const response = await fetch(address, requestInit);
    context.response.body = response.body;
    context.response.headers = response.headers;

    if (next) await next();
}
