
import * as React from "https://esm.sh/react";

function throwOnClient() { Deno; }

export default function Suspense(props: React.SuspenseProps)
{
    try
    {
        throwOnClient();
        return <>{props.fallback}</>;
    }
    catch
    {
        return <>{props.children ?? props.fallback}</>;
    }
}