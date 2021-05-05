
import * as React from "react";

export default function MobileProf()
{
    const element =
        <div className="page">
            <p className="logo">
                <img src="/ofuso.jpg" height={195} width={260} alt="html" />
            </p>
            <h1><strong>suspense</strong></h1>
            <h2>React v{React.version}</h2>
            <p className="copyinfo">© 0000 Company, Inc.</p>
        </div>;
    return element;
}
