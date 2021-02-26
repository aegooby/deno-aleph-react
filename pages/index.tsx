
import { useDeno } from "aleph";
import * as React from "react";

import Logo from "../components/Logo.tsx";
import useCounter from "../lib/useCounter.ts";

export default function Home() 
{
    const [count, isSyncing, increase, decrease] = useCounter();
    const denoVersion = useDeno(() => Deno.version.deno);
    const reactVersion = React.version;

    const element =
        <div className="page">
            <link rel="stylesheet" href="../style/index.css" />
            <p className="logo"><Logo size={150} /></p>
            <h1><strong>Deno</strong> v{denoVersion}</h1>
            <div className="counter">
                <span>Counter:</span>
                {isSyncing && (<em>...</em>)}
                {!isSyncing && (<strong>{count}</strong>)}
                <button onClick={decrease}>-</button>
                <button onClick={increase}>+</button>
            </div>
            <p className="copyinfo">React v{reactVersion} (Aleph)</p>
        </div>;

    return element;
}
