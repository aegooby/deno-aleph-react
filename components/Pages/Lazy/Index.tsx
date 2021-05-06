
import * as React from "react";

import * as Loading from "../../Loading.tsx";

export default function Index()
{
    Loading.useFinishLoading();
    const element =
        <div className="page">
            <p className="logo">
                <img src="/logo.webp" height={304} width={256} alt="logo" />
            </p>
            <h1><strong>https</strong>aurus</h1>
            <h2>React v{React.version}</h2>
            <p className="copyinfo">© 0000 Company, Inc.</p>
        </div>;
    return element;
}
