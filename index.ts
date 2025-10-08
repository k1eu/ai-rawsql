import { createOpenAI } from "@ai-sdk/openai";
import { generateText, jsonSchema, stepCountIs, tool } from "ai";
import { SQL } from "bun";
import z from "zod";

const pg = new SQL(process.env.POSTGRES_URL!);

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = {
  queryDatabase: tool({
    description: [
      "Run read-only SQL queries against the offers database.",
      "Schema:",
      "Table name is `offer` ",
      "```json",
      `[{"column_name":"id","data_type":"uuid","character_maximum_length":null,"column_default":"gen_random_uuid()","is_nullable":"NO"},{"column_name":"deal_type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"property_type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"market_type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"description","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"area_m2","data_type":"numeric","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"rooms","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"bathrooms","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"year_built","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"plot_area_m2","data_type":"numeric","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"floors_total","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"floor_position","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_certificate","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"building_type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"material","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"material_other","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"plot_type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"media_gas","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"media_internet","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"media_electricity","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"media_water","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"media_other","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"road_access","data_type":"smallint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"road_access_other","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"needs_renovation","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_basement","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_elevator","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_balcony","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_terrace","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_garden","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"no_maintenance_fee","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"separate_kitchen","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"two_storeys","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"has_garage","data_type":"boolean","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"region_id","data_type":"uuid","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"city_id","data_type":"uuid","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"street_name","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"building_no","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"unit_no","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"postal_code","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"location","data_type":"USER-DEFINED","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"created_at","data_type":"timestamp with time zone","character_maximum_length":null,"column_default":"CURRENT_TIMESTAMP","is_nullable":"NO"},{"column_name":"updated_at","data_type":"timestamp with time zone","character_maximum_length":null,"column_default":"CURRENT_TIMESTAMP","is_nullable":"NO"},{"column_name":"title","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"price_in_cents","data_type":"bigint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"commission_percent","data_type":"numeric","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"price_in_cents_per_m2","data_type":"bigint","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"country_region","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"}]`,
      "```",
      "Another table is `promoted_offer` which contains promoted offers.",
      "```json",
      `[{"column_name":"id","data_type":"uuid","character_maximum_length":null,"column_default":"gen_random_uuid()","is_nullable":"NO"},{"column_name":"offer_id","data_type":"uuid","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"position","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"created_at","data_type":"timestamp with time zone","character_maximum_length":null,"column_default":"CURRENT_TIMESTAMP","is_nullable":"NO"}]`,
      "```",
      "Use this table to find offers that are currently promoted.",
      "Next One is `region` table which contains regions.",
      "```json",
      `[{"column_name":"id","data_type":"uuid","character_maximum_length":null,"column_default":"gen_random_uuid()","is_nullable":"NO"},{"column_name":"name","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"type","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"terc_woj","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_pow","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_gmi","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_rodz","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"created_at","data_type":"timestamp with time zone","character_maximum_length":null,"column_default":"CURRENT_TIMESTAMP","is_nullable":"NO"},{"column_name":"updated_at","data_type":"timestamp with time zone","character_maximum_length":null,"column_default":"CURRENT_TIMESTAMP","is_nullable":"NO"}]`,
      "```",
      "Use this table to find region names by their IDs.",
      "Another table is `city` which contains cities.",
      "```json",
      `[{"column_name":"id","data_type":"uuid","character_maximum_length":null,"column_default":"gen_random_uuid()","is_nullable":"NO"},{"column_name":"region_id","data_type":"uuid","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"name","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"NO"},{"column_name":"center_point","data_type":"USER-DEFINED","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"simc_sym","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_woj","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_pow","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_gmi","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"},{"column_name":"terc_rodz","data_type":"text","character_maximum_length":null,"column_default":null,"is_nullable":"YES"}]`,
      "```",
      "Use this table to find city names by their IDs.",
      "Only use the tables mentioned above. Do not make up any table or column names.",
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

const server = Bun.serve({
  idleTimeout: 60,
  port: 3000,
  routes: {
    "/": async (req) => {
      req;
      const response = await generateText({
        model: openai.responses("gpt-4o"),
        system:
          "You are a personal assistant. Currently you have access to the queryDatabase tool that can run read-only SQL queries against the database. Use it to answer questions about real estate offers. If you don't know the answer, just say you don't know. Never make up an answer.",
        messages: [
          {
            role: "user",
            content:
              "What region is Bielsko-Biała in? List 5 offers from this Bielsko with area greater than 100 m2 and price more than 1,000,000 PLN. Show their titles, prices and area.",
          },
        ],
        tools,
        stopWhen: stepCountIs(10),
      });

      console.log("Final response:", response);

      return new Response(response.text);
    },
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
