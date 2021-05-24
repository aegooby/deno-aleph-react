
const config =
{
    extends: "./snowpack.config.js",
    env: { SNOWPACK_PUBLIC_GRAPHQL_ENDPOINT: "https://localhost:3443/graphql" }
}

module.exports = config;
