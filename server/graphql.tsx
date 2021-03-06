
import * as async from "@std/async";

import * as Oak from "oak";
import * as Apollo from "apollo-graphql";
import * as graphql from "graphql";
import * as playground from "graphql-playground";

import { Console } from "./console.tsx";
import type { Query } from "../components/Core/GraphQL/GraphQL.tsx";

interface GraphQLAttributes
{
    customSchema: string;
    schema: string;
    resolvers: unknown;
    secure: boolean;
    dgraph: boolean;
}
interface GraphQLBuildAttributes
{
    url: string;
}
interface GraphQLCustomSchema
{
    schema: graphql.GraphQLSchema | undefined;
    path: string;
}

export class GraphQL
{
    private customSchema: GraphQLCustomSchema = { schema: undefined, path: "" };
    private schema: string = "" as const;
    private resolvers: Apollo.GraphQLResolverMap;
    private customPlayground: async.Deferred<string> = async.deferred();
    private playground: async.Deferred<string> = async.deferred();
    private secure: boolean;
    private dgraph: boolean;

    private static dgraphAdminSchema: string = "http://localhost:8080/admin/schema" as const;
    private static dgraphGraphQL: string = "http://localhost:8080/graphql" as const;

    constructor(attributes: GraphQLAttributes)
    {
        this.customSchema.path = attributes.customSchema;
        this.schema = attributes.schema;
        this.resolvers = attributes.resolvers as Apollo.GraphQLResolverMap;
        this.secure = attributes.secure;
        this.dgraph = attributes.dgraph;

        this.buildSchema = this.buildSchema.bind(this);
        this.urlPlayground = this.urlPlayground.bind(this);
        this.renderPlayground = this.renderPlayground.bind(this);
        this.build = this.build.bind(this);

        this.customPost = this.customPost.bind(this);
        this.customGet = this.customGet.bind(this);
        this.customHead = this.customHead.bind(this);

        this.post = this.post.bind(this);
        this.get = this.get.bind(this);
        this.head = this.head.bind(this);
    }
    private async buildSchema(): Promise<void>
    {
        const customSchema = await Deno.readTextFile(this.customSchema.path);
        this.customSchema.schema = graphql.buildSchema(customSchema);
        Apollo.addResolversToSchema(this.customSchema.schema!, this.resolvers);

        const schema = await Deno.readFile(this.schema);
        const requestInit: RequestInit =
        {
            body: schema,
            method: "POST",
            headers: { "content-length": schema.byteLength.toString(), "content-type": "multipart/form-data" }
        };

        const loadSchema = async function ()
        {
            while (true)
            {
                await async.delay(1500);
                try 
                {
                    const response = await fetch(GraphQL.dgraphAdminSchema, requestInit);
                    if (response.ok && response.body)
                    {
                        let body = "";
                        const decoder = new TextDecoder();
                        for await (const bytes of response.body)
                            body += decoder.decode(bytes);
                        const json = JSON.parse(body);
                        if (!json.errors)
                            return;
                        else
                        {
                            for (const error of json.errors)
                                if (!error.message.includes("Unavailable: Server not ready."))
                                {
                                    Console.error(error.message);
                                    return;
                                }
                        }
                    }
                }
                catch { undefined; }
            }
        };
        if (this.dgraph)
            loadSchema();
    }
    private urlPlayground(url: string): string
    {
        const urlParsed = new URL(url);
        switch (urlParsed.hostname)
        {
            case "localhost":
                return this.secure ? "https://localhost" : "http://localhost";
            default:
                return url;
        }
    }
    private renderPlayground(url: string): void
    {
        const urlPlayground = this.urlPlayground(url);
        const customPlaygroundOptions: playground.RenderPageOptions =
        {
            endpoint: urlPlayground + "/graphql/custom",
            subscriptionEndpoint: urlPlayground,
            settings:
            {
                "editor.cursorShape": "line",
                "editor.fontSize": 18,
                "editor.fontFamily": "'Menlo', monospace",
                "editor.reuseHeaders": true,
                "editor.theme": "dark",
                "general.betaUpdates": true,
                "request.credentials": "include",
                "request.globalHeaders": {},
                "schema.polling.enable": true,
                "schema.polling.endpointFilter": "*localhost",
                "schema.polling.interval": 2000,
                "tracing.hideTracingResponse": true,
                "tracing.tracingSupported": true,
            }
        };
        const playgroundOptions: playground.RenderPageOptions =
        {
            endpoint: urlPlayground + "/graphql",
            subscriptionEndpoint: urlPlayground,
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
        this.customPlayground.resolve(playground.renderPlaygroundPage(customPlaygroundOptions));
        this.playground.resolve(playground.renderPlaygroundPage(playgroundOptions));
    }
    public async build(attributes: GraphQLBuildAttributes)
    {
        await this.buildSchema();
        this.renderPlayground(attributes.url);
    }
    public async customPost(context: Oak.Context): Promise<void>
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
            const graphQLArgs: graphql.GraphQLArgs =
            {
                schema: this.customSchema.schema as graphql.GraphQLSchema,
                source: query.query,
                rootValue: this.resolvers,
                contextValue: context,
                variableValues: query.variables,
                operationName: query.operationName,
            };
            const result = await graphql.graphql(graphQLArgs);
            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(result);
        }
        catch (error)
        {
            if (!(error instanceof Deno.errors.Http))
                Console.warn(error);
            const jsonError =
            {
                data: null,
                errors: [ { message: error.message ?? error } ],
            };
            context.response.status = Oak.Status.OK;
            context.response.body = JSON.stringify(jsonError);
        }
    }
    public async customGet(context: Oak.Context): Promise<void>
    {
        context.response.status = Oak.Status.OK;
        context.response.body = await this.customPlayground;
    }
    public async customHead(context: Oak.Context): Promise<void>
    {
        await this.customGet(context);
        context.response.status = Oak.Status.MethodNotAllowed;
        context.response.body = undefined;
    }
    public async post(context: Oak.Context): Promise<void>
    {
        if (!this.dgraph)
        {
            context.response.status = Oak.Status.InternalServerError;
            context.response.body = "500 Internal Server Error: dgraph is disabled!";
            return;
        }
        const request = context.request.originalRequest as Oak.NativeRequest;
        const requestInit: RequestInit =
        {
            body: request.body,
            method: request.method,
            headers: request.headers,
        };
        try
        {
            const response = await fetch(GraphQL.dgraphGraphQL, requestInit);
            context.response.status = response.status;
            context.response.body = response.body;
            context.response.headers = response.headers;
        }
        catch { context.response.status = Oak.Status.InternalServerError; }
    }
    public async get(context: Oak.Context): Promise<void>
    {
        if (!this.dgraph)
        {
            context.response.status = Oak.Status.InternalServerError;
            context.response.body = "500 Internal Server Error: dgraph is disabled!";
            return;
        }
        context.response.status = Oak.Status.OK;
        context.response.body = await this.playground;
    }
    public async head(context: Oak.Context): Promise<void>
    {
        if (!this.dgraph)
        {
            context.response.status = Oak.Status.InternalServerError;
            context.response.body = "500 Internal Server Error: dgraph is disabled!";
            return;
        }
        await this.get(context);
        context.response.status = Oak.Status.MethodNotAllowed;
        context.response.body = undefined;
    }






}
