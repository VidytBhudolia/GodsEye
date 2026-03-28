import axios from "axios";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { logger } from "../../utils";
import { createGroqClient, withGroqTimeout } from "./groqClient";

const SYSTEM_PROMPT =
  "You are an OSINT intelligence analyst. Given data about a tracked entity (ship, aircraft, or satellite), write a 150-250 word intelligence summary. Search the web only if you need additional context about this specific entity. Be factual and cite sources inline. Flag anything anomalous.";

function toText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
    return content.text;
  }

  return "";
}

function normalizeSnippet(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 1800);
}

async function scrapeSingleUrl(url: string, apiKey: string): Promise<string> {
  const scrapeResponse = await axios.post(
    "https://api.firecrawl.dev/v1/scrape",
    {
      url,
      formats: ["markdown"],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 7000,
    }
  );

  const markdown = scrapeResponse.data?.data?.markdown;
  if (typeof markdown === "string" && markdown.trim()) {
    return normalizeSnippet(markdown);
  }

  const fallbackText = scrapeResponse.data?.data?.content;
  if (typeof fallbackText === "string" && fallbackText.trim()) {
    return normalizeSnippet(fallbackText);
  }

  return "";
}

async function firecrawlWebSearch(query: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is missing.");
  }

  const searchResponse = await axios.post(
    "https://api.firecrawl.dev/v1/search",
    {
      query,
      limit: 3,
      scrapeOptions: {
        formats: ["markdown"],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 7000,
    }
  );

  const results = Array.isArray(searchResponse.data?.data) ? searchResponse.data.data.slice(0, 3) : [];
  if (!results.length) {
    return "No relevant web results found.";
  }

  const sections: string[] = [];
  for (const result of results) {
    const url = typeof result?.url === "string" ? result.url : "unknown";

    let body = "";
    if (typeof result?.markdown === "string" && result.markdown.trim()) {
      body = normalizeSnippet(result.markdown);
    } else if (typeof result?.content === "string" && result.content.trim()) {
      body = normalizeSnippet(result.content);
    } else if (url !== "unknown") {
      try {
        body = await scrapeSingleUrl(url, apiKey);
      } catch (error) {
        logger.warn("Firecrawl scrape fallback failed.", {
          err: error instanceof Error ? error.message : String(error),
          url,
        });
      }
    }

    if (body) {
      sections.push(`Source: ${url}\n${body}`);
    }
  }

  return sections.length ? sections.join("\n\n") : "No relevant web context available.";
}

const webSearchTool = tool(
  async ({ query }) => {
    try {
      return await firecrawlWebSearch(query);
    } catch (error) {
      logger.warn("Firecrawl search failed; continuing without external search.", {
        err: error instanceof Error ? error.message : String(error),
      });
      return "Web search unavailable for this request.";
    }
  },
  {
    name: "web_search",
    description: "Searches the web and returns scraped text from the top 3 relevant results.",
    schema: z.object({
      query: z.string().min(3).max(300),
    }),
  }
);

function createOsintAgent() {
  return createAgent({
    model: createGroqClient(),
    tools: [webSearchTool],
    systemPrompt: SYSTEM_PROMPT,
  });
}

export async function generateOsintSummary(entityContext: string): Promise<string> {
  const agent = createOsintAgent();

  const result = await withGroqTimeout(
    agent.invoke({
      messages: [
        {
          role: "user",
          content: `Entity context:\n${entityContext}\n\nGenerate the requested intelligence summary.`,
        },
      ],
    })
  );

  const messages = Array.isArray((result as { messages?: unknown[] }).messages)
    ? ((result as { messages: unknown[] }).messages)
    : [];

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i] as { content?: unknown; type?: string; role?: string };
    if (message?.type === "ai" || message?.role === "assistant") {
      const summary = toText(message.content).trim();
      if (summary) {
        return summary;
      }
    }
  }

  throw new Error("LLM returned an empty summary.");
}
