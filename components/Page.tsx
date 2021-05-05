
import * as React from "react";
import * as ReactHelmet from "react-helmet";
import nprogress from "nprogress";

import { Suspense, throwOnClient } from "./Core/Core.tsx";

interface FallbackProps
{
    element?: React.ReactElement | undefined;
}

function Fallback(props: FallbackProps)
{
    const effect = function () 
    {
        try { throwOnClient(); }
        catch { nprogress.done(); }
    };
    React.useEffect(effect);
    return props.element ?? <></>;
}

interface Props
{
    helmet: React.ReactElement;
    content: React.ReactElement;
    lazy?: true;
}

export default function Page(props: Props)
{
    try { throwOnClient(); } catch { React.useState(nprogress.start()); }
    const suspenseContent =
        <Suspense fallback={<Fallback />}>
            {props.content}
        </Suspense>;
    const effect = function () 
    {
        try { throwOnClient(); }
        catch { nprogress.done(); }
    };
    if (!props.lazy) React.useEffect(effect);
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                {props.helmet}
            </ReactHelmet.Helmet>
            {props.lazy ? suspenseContent : props.content}
        </>;
    return element;
}
