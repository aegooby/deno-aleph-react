
import * as React from "react";

import Page from "../Page.tsx";
const Lazy = React.lazy(() => import("./Lazy/MobileProf.tsx"));

export default function MobileProf()
{
    const element =
        <Page
            helmet={<title>httpsaurus | lazy</title>}
            content={<Lazy />}
            lazy
        />;
    return element;
}
