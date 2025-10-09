import { createOpenAI } from "@ai-sdk/openai";
import {
  generateText,
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
} from "ai";
import { SQL } from "bun";
import z from "zod";

const pg = new SQL(process.env.POSTGRES_URL!);

async function checkAvailableTables() {
  const [readableSchema] = await pg.unsafe(`
    WITH readable_cols AS (
  SELECT 
      c.table_schema,
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.ordinal_position
  FROM information_schema.columns c
  WHERE 
      c.table_schema = 'public'
      AND c.table_name IN (
          SELECT tablename
          FROM pg_tables
          WHERE has_table_privilege(format('%I.%I', schemaname, tablename), 'SELECT')
            AND schemaname = 'public'
            AND tablename <> 'spatial_ref_sys'
      )
      AND has_column_privilege(format('%I.%I', c.table_schema, c.table_name), c.column_name, 'SELECT')
)
, per_table AS (
  SELECT 
      table_schema,
      table_name,
      json_agg(
        json_build_object(
          'column',   column_name,
          'type',     data_type,
          'nullable', is_nullable
        )
        ORDER BY ordinal_position
      ) AS cols
  FROM readable_cols
  GROUP BY table_schema, table_name
)
SELECT json_object_agg(
         table_name,
         cols
       ) AS readable_schema
FROM per_table;
`);
  console.dir(readableSchema, { depth: null });

  return readableSchema;
}

await checkAvailableTables();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = {
  discoverDatabaseSchema: tool({
    description: "Discover available tables and their columns in the database.",
    inputSchema: z.object({}),
    async execute() {
      const tables = await checkAvailableTables();

      return tables;
    },
  }),
  queryDatabase: tool({
    description: [
      "Run read-only SQL queries against the offers database.",
      "Schema can be found in the `discoverDatabaseSchema` tool.",
      "Only use the tables that you got in the discovery step. Do not make up table or column names.",
      "Before executing a query, make sure you already know the table and column names.",
      "Use JOINs to combine data from multiple tables when necessary.",
      "Try to limit the number of results returned by using WHERE and LIMIT clauses. (specifcally when user asks for a number of offers)",
      "--",
      "Guidelines:",
      "Only use SELECT queries. Do not use INSERT, UPDATE, DELETE or any other commands.",
      "If you are unsure about the query, just say you don't know.",
    ].join("\n"),
    inputSchema: z.object({
      sql: z
        .string()
        .describe(
          "Parameterized SQL statement to execute. Prefer SELECT queries when exploring offers."
        ),
    }),
    async execute(input) {
      const { sql: statement } = input;

      console.log("Executing query:", { statement });

      try {
        const result = await pg.unsafe(statement);
        console.log(result);
        return { result };
      } catch (error) {
        console.error("Query error:", error);
        return {
          error: (error as Error).message,
        };
      }
    },
  }),
};

const OfferAgent = new Agent({
  model: openai.responses("gpt-4o"),
  system:
    "You are a personal assistant. Currently you have access to the queryDatabase tool that can run read-only SQL queries against the database. Use it to answer questions about real estate offers. If you don't know the answer, just say you don't know. Never make up an answer.",
  tools,
  stopWhen: stepCountIs(10),
});

const server = Bun.serve({
  idleTimeout: 60,
  port: 3000,
  routes: {
    "/": async (req) => {
      req;
      const response = await OfferAgent.generate({
        messages: [
          {
            role: "user",
            content:
              "What region is Bielsko-Biała in? List 5 offers from this Bielsko with area greater than 100 m2 and price more than 1,000,000 PLN. Show their titles, prices and area.",
          },
        ],
      });

      console.log("Final response:", response);

      return new Response(response.text);
    },
    "/check": async (req) => {
      await checkAvailableTables();
      return new Response("OK");
    },
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
