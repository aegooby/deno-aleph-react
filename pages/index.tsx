
import { useDeno } from "aleph";
import * as React from "react";

import Logo from "../components/logo.tsx";
import useCounter from "../lib/useCounter.ts";

export default function Home() 
{
    const [count, isSyncing, increase, decrease] = useCounter();
    const version = useDeno(() => Deno.version.deno);

    const logo = <Logo size={75} />;
    const element =
        <div className="page">
            <link rel="stylesheet" href="../style/index.css" />
            <p className="logo">{logo}</p>
            <h1>Welcome to <strong>Deno</strong></h1>
            <div className="counter">
                <span>Counter:</span>
                {isSyncing && (<em>...</em>)}
                {!isSyncing && (<strong>{count}</strong>)}
                <button onClick={decrease}>-</button>
                <button onClick={increase}>+</button>
            </div>
            <p className="copyinfo">Built by Aleph.js in Deno {version}</p>
        </div>;

    return element;
}
