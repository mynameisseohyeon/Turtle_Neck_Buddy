import type { OverlayCustomPosition, OverlayLanguage, OverlayPosition, OverlaySettings } from "./overlayMessages";

export const OVERLAY_SETTINGS_STORAGE_KEY = "turtle-neck-buddy-overlay-settings";

export const DEFAULT_REMINDER_INTERVAL_MINUTES = 30;
export const MIN_REMINDER_INTERVAL_MINUTES = 10;
export const MAX_REMINDER_INTERVAL_MINUTES = 180;
export const REMINDER_INTERVAL_STEP_MINUTES = 10;
export const OVERLAY_LANGUAGE_OPTIONS: OverlayLanguage[] = ["en", "ko", "ja", "zh", "es"];
export const DEFAULT_TURTLE_SIZE = 50;
export const MIN_TURTLE_SIZE = 20;
export const MAX_TURTLE_SIZE = 80;

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  overlayPosition: "bottom-right",
  reminderIntervalMinutes: DEFAULT_REMINDER_INTERVAL_MINUTES,
  language: "en",
  turtleSize: DEFAULT_TURTLE_SIZE,
  customPosition: null,
  lastReminderShownAt: null,
  excludedHostnames: []
};

function isOverlayPosition(value: unknown): value is OverlayPosition {
  return value === "bottom-right" || value === "bottom-left";
}

function isOverlayLanguage(value: unknown): value is OverlayLanguage {
  return OVERLAY_LANGUAGE_OPTIONS.includes(value as OverlayLanguage);
}

function normalizeReminderIntervalMinutes(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_SETTINGS.reminderIntervalMinutes;
  }

  const steppedValue = Math.round(value / REMINDER_INTERVAL_STEP_MINUTES) * REMINDER_INTERVAL_STEP_MINUTES;
  return Math.min(MAX_REMINDER_INTERVAL_MINUTES, Math.max(MIN_REMINDER_INTERVAL_MINUTES, steppedValue));
}

function normalizeCustomPosition(value: unknown): OverlayCustomPosition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<OverlayCustomPosition>;

  if (typeof candidate.xPercent !== "number" || typeof candidate.yPercent !== "number") {
    return null;
  }

  return {
    xPercent: Math.min(95, Math.max(5, candidate.xPercent)),
    yPercent: Math.min(95, Math.max(5, candidate.yPercent))
  };
}

function normalizeTurtleSize(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_SETTINGS.turtleSize;
  }

  return Math.min(MAX_TURTLE_SIZE, Math.max(MIN_TURTLE_SIZE, Math.round(value)));
}

export function normalizeOverlaySettings(value: unknown): OverlaySettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_OVERLAY_SETTINGS;
  }

  const candidate = value as Partial<OverlaySettings>;

  return {
    overlayEnabled:
      typeof candidate.overlayEnabled === "boolean"
        ? candidate.overlayEnabled
        : DEFAULT_OVERLAY_SETTINGS.overlayEnabled,
    overlayPosition: isOverlayPosition(candidate.overlayPosition)
      ? candidate.overlayPosition
      : DEFAULT_OVERLAY_SETTINGS.overlayPosition,
    reminderIntervalMinutes: normalizeReminderIntervalMinutes(candidate.reminderIntervalMinutes),
    language: isOverlayLanguage(candidate.language) ? candidate.language : DEFAULT_OVERLAY_SETTINGS.language,
    turtleSize: normalizeTurtleSize(candidate.turtleSize),
    customPosition: normalizeCustomPosition(candidate.customPosition),
    lastReminderShownAt:
      typeof candidate.lastReminderShownAt === "string"
        ? candidate.lastReminderShownAt
        : DEFAULT_OVERLAY_SETTINGS.lastReminderShownAt,
    excludedHostnames: Array.isArray(candidate.excludedHostnames)
      ? candidate.excludedHostnames.filter((hostname) => typeof hostname === "string")
      : DEFAULT_OVERLAY_SETTINGS.excludedHostnames
  };
}
