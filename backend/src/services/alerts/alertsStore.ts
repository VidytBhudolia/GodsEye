export interface Alert {
  id: string;
  entityId: string;
  entityName: string;
  type:
    | "AIS_DARK"
    | "SQUAWK_7700"
    | "SQUAWK_7600"
    | "SQUAWK_7500"
    | "HIGH_SPEED"
    | "UNEXPECTED_REGION";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  detectedAt: string;
  lat: number;
  lon: number;
  acknowledged: boolean;
}

const MAX_ALERTS = 200;
const alerts: Alert[] = [];

export function addAlert(alert: Alert): void {
  alerts.push(alert);

  if (alerts.length > MAX_ALERTS) {
    alerts.splice(0, alerts.length - MAX_ALERTS);
  }
}

export function getAlerts(): Alert[] {
  return [...alerts].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
}

export function acknowledgeAlert(id: string): boolean {
  const target = alerts.find((alert) => alert.id === id);
  if (!target) {
    return false;
  }

  target.acknowledged = true;
  return true;
}
