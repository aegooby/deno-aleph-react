
import * as React from "react";
import * as ReactHelmet from "react-helmet";

import { Suspense } from "./Core/Core.tsx";

interface Props
{
    helmet?: React.ReactElement;
    content: React.ReactElement;
    lazy?: true;
}

export default function Page(props: Props)
{
    const element: React.ReactElement =
        <>
            <ReactHelmet.Helmet>
                {props.helmet}
                <link rel="stylesheet" href="/nprogress.css" />
            </ReactHelmet.Helmet>
            <Suspense fallback={<></>} loading>
                {props.content}
            </Suspense>
        </>;
    return element;
}
