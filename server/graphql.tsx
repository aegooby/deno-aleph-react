
import * as Oak from "oak";
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
    public static schema:
        {
            schema: graphql.GraphQLSchema | undefined;
            path: string;
        } = { schema: undefined, path: "" };
    public static resolvers: unknown;
    private static playgroundHTML: Promise<string>;
    private static async buildSchema()
    {
        const schema = await Deno.readTextFile(GraphQL.schema.path);
        GraphQL.schema.schema = graphql.buildSchema(schema);
    }
    public static async query(context: Oak.Context): Promise<void>
    {
        try
        {
            const query: Query = { query: "" };
            switch (context.request.headers.get("content-type"))
            {
                case "application/json":
                    {
                        const jsonRequest = await context.request.body({ type: "json" }).value;
                        query.query = jsonRequest.query;
                        query.operationName = jsonRequest.operationName;
                        query.variables = jsonRequest.variables;
                        break;
                    }
                case "application/graphql":
                    {
                        const textRequest = await context.request.body({ type: "text" }).value;
                        query.query = textRequest;
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

            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(result);
        }
        catch (error)
        {
            Console.warn("Encountered GraphQL error");
            const jsonError =
            {
                data: null,
                errors: [{ message: error.message ? error.message : error }],
            };
            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(jsonError);
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
        GraphQL.playgroundHTML =
            Promise.resolve(playground.renderPlaygroundPage(playgroundOptions));
    }
    public static async build(attributes: GraphQLBuildAttributes)
    {
        await GraphQL.buildSchema();
        GraphQL.renderPlayground(attributes.url);
    }
    public static async playground(context: Oak.Context): Promise<void>
    {
        context.response.status = Oak.Status.OK;
        context.response.body = await GraphQL.playgroundHTML;
    }
}
