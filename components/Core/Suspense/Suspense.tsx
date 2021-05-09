
import * as React from "react";
import { throwOnClient } from "../Core.tsx";

import nprogress from "nprogress";

interface SuspenseProps extends React.SuspenseProps
{
    children?: React.ReactNode;
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
        if (props.loading && !nprogress.isStarted())
            React.useState(nprogress.start());
        const element: React.ReactElement =
            <React.Suspense fallback={props.fallback}>
                {props.children}
            </React.Suspense>;
        return element;
    }
}