import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type ModelMessage } from "ai";
import { SQL } from "bun";

const pg = new SQL(process.env.POSTGRES_URL!);

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": async () => {
      const response = await generateText({
        model: openai.responses("gpt-4o"),
        messages: [
          {
            role: "user",
            content: "Write a haiku about Bun.js",
          },
        ],
      });

      return new Response(response.text);
    },
  },
});

console.log(`Listening on http://localhost:${server.port} ...`);
