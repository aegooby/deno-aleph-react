
import * as React from "react";
import { throwOnClient } from "../Core.tsx";
import nprogress from "nprogress";

interface SuspenseProps extends React.SuspenseProps
{
    loading?: true;
}

export function Suspense(props: SuspenseProps)
{
    try
    {
        throwOnClient();
        return <>{props.fallback}</>;
    }
    catch
    {
        if (props.loading) React.useState(nprogress.done());
        if (props.loading) React.useState(nprogress.start());
        const Children = function ()
        {
            const effect = function () 
            {
                try { throwOnClient(); }
                catch { nprogress.done(); }
            };
            React.useEffect(effect);
            return <>{props.children}</>;
        };
        const element: React.ReactElement =
            <React.Suspense fallback={props.fallback}>
                {props.loading ? < Children /> : props.children}
            </React.Suspense>;
        return element;
    }
}