
import type * as Aleph from "aleph/types.ts";

declare global
{
    interface Window { $count: number; }
}

export default async function handler(req: Aleph.APIRequest): Promise<void>
{
    let count = window.$count || 0;
    const error400 =
    {
        error: "UnknownAction",
        status: 400,
        message: `undefined action "${req.params.action}"`
    };

    switch (req.params.action) 
    {
        case "increase":
            count++;
            window.$count = count;
            await req.json({ count });
            break;
        case "decrease":
            count--;
            window.$count = count;
            await req.json({ count });
            break;
        default:
            await req.status(400).json(error400);
            break;
    }
}
