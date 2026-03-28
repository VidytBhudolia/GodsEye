import { ChatGroq } from "@langchain/groq";

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_TIMEOUT_MS = 8000;

export class GroqTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Groq timed out after ${timeoutMs}ms`);
    this.name = "GroqTimeoutError";
  }
}

export function createGroqClient(): ChatGroq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  return new ChatGroq({
    apiKey,
    model: GROQ_MODEL,
    temperature: 0.2,
  });
}

export async function withGroqTimeout<T>(operation: Promise<T>, timeoutMs = GROQ_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => reject(new GroqTimeoutError(timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
