import { Router } from "express";
import { z } from "zod";
import { acknowledgeAlert, getAlerts } from "../services/alerts/alertsStore";

const router = Router();

const querySchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  acknowledged: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      if (value === "true" || value === true) {
        return true;
      }

      if (value === "false" || value === false) {
        return false;
      }

      return value;
    }, z.boolean().optional()),
});

const paramsSchema = z.object({
  alertId: z.string().trim().min(1),
});

router.get("/", (req, res) => {
  const parsed = querySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query parameters." });
  }

  const { severity, acknowledged } = parsed.data;
  const filtered = getAlerts().filter((alert) => {
    if (severity && alert.severity !== severity) {
      return false;
    }

    if (typeof acknowledged === "boolean" && alert.acknowledged !== acknowledged) {
      return false;
    }

    return true;
  });

  return res.json({
    alerts: filtered,
    count: filtered.length,
  });
});

router.post("/:alertId/acknowledge", (req, res) => {
  const parsed = paramsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ success: false });
  }

  const success = acknowledgeAlert(parsed.data.alertId);
  return res.json({ success });
});

export default router;
