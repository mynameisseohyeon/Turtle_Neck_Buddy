export const STRETCH_RECORDS_STORAGE_KEY = "turtle-neck-buddy-stretch-records";
export const DEFAULT_DAILY_STRETCH_GOAL = 4;

export type StretchRecord = {
  date: string;
  completedCount: number;
};

export type StretchRecords = {
  dailyGoal: number;
  days: StretchRecord[];
};

export const DEFAULT_STRETCH_RECORDS: StretchRecords = {
  dailyGoal: DEFAULT_DAILY_STRETCH_GOAL,
  days: []
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeStretchRecords(value: unknown): StretchRecords {
  if (!value || typeof value !== "object") {
    return DEFAULT_STRETCH_RECORDS;
  }

  const candidate = value as Partial<StretchRecords>;
  const dailyGoal =
    typeof candidate.dailyGoal === "number" && Number.isFinite(candidate.dailyGoal)
      ? Math.max(1, Math.round(candidate.dailyGoal))
      : DEFAULT_DAILY_STRETCH_GOAL;
  const days = Array.isArray(candidate.days)
    ? candidate.days
        .filter(
          (record): record is StretchRecord =>
            Boolean(record) &&
            typeof record.date === "string" &&
            typeof record.completedCount === "number" &&
            Number.isFinite(record.completedCount)
        )
        .map((record) => ({
          date: record.date,
          completedCount: Math.max(0, Math.round(record.completedCount))
        }))
    : [];

  return { dailyGoal, days };
}

export function addStretchCompletion(records: StretchRecords, completedAt = new Date()): StretchRecords {
  const date = getLocalDateKey(completedAt);
  const existing = records.days.find((record) => record.date === date);
  const days = existing
    ? records.days.map((record) =>
        record.date === date ? { ...record, completedCount: record.completedCount + 1 } : record
      )
    : [...records.days, { date, completedCount: 1 }];

  return {
    ...records,
    days: days.sort((left, right) => right.date.localeCompare(left.date)).slice(0, 90)
  };
}

export function getTodayCompletedCount(records: StretchRecords, now = new Date()) {
  return records.days.find((record) => record.date === getLocalDateKey(now))?.completedCount ?? 0;
}

export function getCurrentStreak(records: StretchRecords, now = new Date()) {
  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (true) {
    const completed = records.days.find((record) => record.date === getLocalDateKey(cursor))?.completedCount ?? 0;
    if (completed <= 0) {
      return streak;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
}
