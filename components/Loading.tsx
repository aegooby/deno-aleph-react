
import * as React from "react";
import nprogress from "nprogress";

import { throwOnClient } from "./Core/Core.tsx";

export function useStartLoading()
{
    try { throwOnClient(); }
    catch
    {
        if (!nprogress.isStarted())
            nprogress.start();
    }
}
export function useFinishLoading()
{
    try { throwOnClient(); }
    catch
    {
        if (nprogress.isStarted())
            nprogress.done();
    }
}