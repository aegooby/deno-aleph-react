
import type * as Aleph from "aleph/types.ts";

declare global
{
    interface Window { $count: number; }
}

export default async function handler(req: Aleph.APIRequest): Promise<void>
{
    await req.json({ count: window.$count || 0 });
}
