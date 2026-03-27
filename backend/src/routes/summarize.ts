import { Router } from "express";
import { ChatGroq } from "@langchain/groq";
import { supabase, upsertAiSummary } from "../services/database/supabaseClient";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const router = Router();

// In-memory rate limiting map (IP -> timestamps array)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5; // max requests
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return true; // Limited
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

router.post("/:id/summarize", async (req, res) => {
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const entityId = req.params.id;

  try {
    // Check if we already have it in Supabase
    const { data: cachedSummary } = await supabase
      .from("ai_summaries")
      .select("*")
      .eq("entity_id", entityId)
      .single();

    if (cachedSummary && cachedSummary.summary) {
      return res.json({ summary: cachedSummary.summary });
    }

    // Identify entity and generate summary
    const { data: entityData } = await supabase
      .from("entities")
      .select("*")
      .eq("entity_id", entityId)
      .single();

    if (!entityData) {
      return res.status(404).json({ error: "Entity not found." });
    }

    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama3-8b-8192", // Prescribed model
    });

    const response = await model.invoke([
      { role: "system", content: "You are an intelligence analyst summary agent." },
      { role: "user", content: `Summarize the following entity data in 3 concise bullet points:\n${JSON.stringify(entityData, null, 2)}` }
    ]);

    const summaryStr = response.content.toString();

    // Cache to DB
    await upsertAiSummary(entityId, summaryStr);
    
    return res.json({ summary: summaryStr });

  } catch (err: any) {
    console.error("[Summarize API] Error:", err.message);
    
    // Heuristic checking if it's an API limit from Groq
    if (err.message.includes("429") || err.message.includes("rate limit")) {
       return res.status(429).json({ error: "Underlying LLM service is rate limited. Please try again later." });
    }

    return res.status(500).json({ error: "Failed to summarize entity." });
  }
});

export default router;
