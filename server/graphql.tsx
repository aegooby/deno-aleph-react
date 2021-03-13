
import * as http from "https://deno.land/std/http/mod.ts";

import * as graphql from "https://esm.sh/graphql";
import "https://cdn.skypack.dev/reflect-metadata";
import * as typegraphql from "https://cdn.skypack.dev/type-graphql@0.8.0";
import * as playground from "https://esm.sh/graphql-playground-html";

@typegraphql.Resolver()
class HelloResolver
{
    @typegraphql.Query(() => String)
    public hello()
    {
        return "Hello";
    }
}

export class GraphQL
{
    private schema?: graphql.GraphQLSchema;
    public async build(): Promise<void>
    {
        this.schema = await typegraphql.buildSchema({ resolvers: [HelloResolver] });
    }
    private async query(request: http.ServerRequest): Promise<http.Response>
    {
        try
        {
            const decoder = new TextDecoder();
            const body: string = decoder.decode(await Deno.readAll(request.body));
            const query: { query: string; operationName?: string; variables?: { [key: string]: unknown; }; } = { query: "" };
            switch (request.headers.get("content-type"))
            {
                case "application/json":
                    {
                        const json = JSON.parse(body);
                        query.query = json.query;
                        query.operationName = json.operationName;
                        query.variables = json.variables;
                        break;
                    }
                case "application/graphql":
                    {
                        query.query = body;
                        break;
                    }
                default:
                    throw new Error("Invalid GraphQL MIME type");
            }
            const graphqlargs: graphql.GraphQLArgs =
            {
                schema: this.schema!,
                source: query.query,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphqlargs);
            const response: http.Response =
            {
                status: 200,
                body: JSON.stringify(result),
            };
            return response;
        }
        catch (error)
        {
            const json =
            {
                data: null,
                errors: [{ message: error.message ? error.message : error }],
            };
            const response: http.Response =
            {
                status: 200,
                body: JSON.stringify(json),
            };
            return response;
        }
    }
    private playground(request: http.ServerRequest): http.Response
    {
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: "https://localhost:8443/graphql",
            subscriptionEndpoint: "https://localhost:8443/"
        };
        const response: http.Response =
        {
            status: 200,
            body: playground.renderPlaygroundPage(playgroundOptions),
        };
        return response;
    }
    public async resolve(request: http.ServerRequest): Promise<http.Response>
    {
        if (!this.schema)
            await this.build();
        if (request.url !== "/graphql")
            throw new Error("Retard it's not GraphQL in GraphQL read the title FUCKO");
        switch (request.method)
        {
            case "GET":
                return this.playground(request);
            case "POST":
                return await this.query(request);
            default:
                throw new Error("Invalid HTTP method for GraphQL");
        }
    }
}
