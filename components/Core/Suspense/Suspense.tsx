
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
        return <React.Suspense fallback={props.fallback}>{props.children}</React.Suspense>;
    }
}