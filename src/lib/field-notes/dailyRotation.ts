export const FIELD_NOTE_ROTATION_DAYS = 5;

export function utcDayIndex(date: Date = new Date()) {
  return Math.floor(date.getTime() / 86_400_000);
}

export function dailyRotationSlot(
  date: Date = new Date(),
  cycleDays = FIELD_NOTE_ROTATION_DAYS
) {
  if (!Number.isInteger(cycleDays) || cycleDays < 2) {
    throw new Error("Field-note rotation requires at least two days.");
  }
  return ((utcDayIndex(date) % cycleDays) + cycleDays) % cycleDays;
}

export function candidateRotationSlot(
  pageId: number,
  cycleDays = FIELD_NOTE_ROTATION_DAYS
) {
  if (!Number.isInteger(cycleDays) || cycleDays < 2) {
    throw new Error("Field-note rotation requires at least two days.");
  }
  return ((Math.trunc(pageId) % cycleDays) + cycleDays) % cycleDays;
}

export function isPreferredDailyCandidate(
  pageId: number,
  date: Date = new Date(),
  cycleDays = FIELD_NOTE_ROTATION_DAYS
) {
  return candidateRotationSlot(pageId, cycleDays) === dailyRotationSlot(date, cycleDays);
}
