
import * as http from "std/http";

import * as graphql from "graphql";
import * as playground from "graphql-playground";

import { Console } from "./console.tsx";
import type { Query } from "../components/Core/GraphQL/GraphQL.tsx";

interface GraphQLBuildAttributes
{
    url: string;
}

export class GraphQL
{
    public static methods: string[] = ["POST", "GET"];
    public static schema:
        {
            schema: graphql.GraphQLSchema | undefined;
            path: string;
        } = { schema: undefined, path: "" };
    public static resolvers: unknown;
    private static playgroundHTML: string;
    private static async buildSchema()
    {
        const schema = await Deno.readTextFile(GraphQL.schema.path);
        GraphQL.schema.schema = graphql.buildSchema(schema);
    }
    private static async query(request: http.ServerRequest): Promise<http.Response>
    {
        try
        {
            const decoder = new TextDecoder();
            const body: string = decoder.decode(await Deno.readAll(request.body));
            const query: Query = { query: "" };
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
                schema: GraphQL.schema.schema as graphql.GraphQLSchema,
                source: query.query,
                rootValue: GraphQL.resolvers,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphqlargs);
            const response: http.Response =
            {
                status: http.Status.OK,
                body: JSON.stringify(result),
            };
            return response;
        }
        catch (error)
        {
            Console.warn("Encountered GraphQL error");
            const json =
            {
                data: null,
                errors: [{ message: error.message ? error.message : error }],
            };
            const response: http.Response =
            {
                status: http.Status.OK,
                body: JSON.stringify(json),
            };
            return response;
        }
    }
    private static renderPlayground(url: string)
    {
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: url + "/graphql",
            subscriptionEndpoint: url,
            settings:
            {
                "editor.cursorShape": "line",
                "editor.fontSize": 18,
                "editor.fontFamily": "'Menlo', monospace",
                "editor.reuseHeaders": true,
                "editor.theme": "dark",
                "general.betaUpdates": true,
                "request.credentials": "omit",
                "request.globalHeaders": {},
                "schema.polling.enable": true,
                "schema.polling.endpointFilter": "*localhost",
                "schema.polling.interval": 2000,
                "tracing.hideTracingResponse": true,
                "tracing.tracingSupported": true,
            }
        };
        GraphQL.playgroundHTML = playground.renderPlaygroundPage(playgroundOptions);
    }
    public static async build(attributes: GraphQLBuildAttributes)
    {
        await GraphQL.buildSchema();
        GraphQL.renderPlayground(attributes.url);
    }
    public static async resolve(request: http.ServerRequest): Promise<http.Response>
    {
        if (request.url !== "/graphql")
            throw new Error("Invalid request URL for GraphQL");
        switch (request.method)
        {
            case "GET":
                return { status: http.Status.OK, body: GraphQL.playgroundHTML };
            case "POST":
                return await GraphQL.query(request);
            default:
                throw new Error("Invalid HTTP method for GraphQL");
        }
    }
}
