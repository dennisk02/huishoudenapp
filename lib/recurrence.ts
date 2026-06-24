export type Frequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: "Dagelijks",
  WEEKLY: "Wekelijks",
  BIWEEKLY: "Per 2 weken",
  MONTHLY: "Per maand",
};

export function nextDueDate(from: Date, frequency: Frequency): Date {
  const next = new Date(from);
  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "BIWEEKLY":
      next.setDate(next.getDate() + 14);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
