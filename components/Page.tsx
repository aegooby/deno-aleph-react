
import * as React from "react";
import * as ReactHelmet from "react-helmet";

import { Suspense } from "./Core/Core.tsx";
import * as Loading from "./Loading.tsx";

interface Props
{
    helmet?: React.ReactElement;
    content: React.ReactElement;
    lazy?: true;
}

export default function Page(props: Props)
{
    if (!props.lazy)
    {
        React.useState(Loading.useStartLoading());
        React.useState(Loading.useFinishLoading());
    }
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                {props.helmet}
                <link rel="stylesheet" href="/nprogress.css" />
            </ReactHelmet.Helmet>
            <Suspense fallback={props.lazy ? <></> : props.content} loading={props.lazy}>
                {props.content}
            </Suspense>
        </>;
    return element;
}
