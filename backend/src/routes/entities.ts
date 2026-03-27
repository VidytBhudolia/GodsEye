import { Router } from "express";
import { getEntities } from "../services/database/supabaseClient";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const { data, error } = await getEntities(typeFilter);
    
    if (error) {
      console.error("[Entities API] Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch entities." });
    }
    
    return res.json({ data });
  } catch (err: any) {
    console.error("[Entities API] Server error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
