
import { useDeno } from "aleph";
import * as React from "react";

import Logo from "../components/logo.tsx";
import useCounter from "../lib/useCounter.ts";

export default function Home() 
{
    const [count, isSyncing, increase, decrease] = useCounter();
    const version = useDeno(() => Deno.version.deno);

    const element =
        <div className="page">
            <link rel="stylesheet" href="../style/index.css" />
            <p className="logo"><Logo size={150} /></p>
            <h1>Welcome to <strong>Deno</strong></h1>
            <p className="links">
                <a href="#" target="_blank">About</a>
                <span></span>
                <a href="#" target="_blank">Get Started</a>
                <span></span>
                <a href="#" target="_blank">Docs</a>
                <span></span>
                <a href="#" target="_blank">Github</a>
            </p>
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
