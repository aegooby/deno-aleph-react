
// deno-lint-ignore-file no-undef
import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "../components/App.tsx";

// deno-lint-ignore ban-ts-comment
// @ts-ignore
ReactDOM.hydrate(<App />, document.querySelector("#root"));
