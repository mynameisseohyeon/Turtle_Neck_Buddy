import type { OverlayPosition, OverlaySettings, ReminderIntervalMinutes } from "./overlayMessages";

export const OVERLAY_SETTINGS_STORAGE_KEY = "turtle-neck-buddy-overlay-settings";

export const REMINDER_INTERVAL_OPTIONS: ReminderIntervalMinutes[] = [30, 50, 60];

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  overlayPosition: "bottom-right",
  reminderIntervalMinutes: 50,
  excludedHostnames: []
};

function isOverlayPosition(value: unknown): value is OverlayPosition {
  return value === "bottom-right" || value === "bottom-left";
}

function isReminderIntervalMinutes(value: unknown): value is ReminderIntervalMinutes {
  return value === 30 || value === 50 || value === 60;
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
    reminderIntervalMinutes: isReminderIntervalMinutes(candidate.reminderIntervalMinutes)
      ? candidate.reminderIntervalMinutes
      : DEFAULT_OVERLAY_SETTINGS.reminderIntervalMinutes,
    excludedHostnames: Array.isArray(candidate.excludedHostnames)
      ? candidate.excludedHostnames.filter((hostname) => typeof hostname === "string")
      : DEFAULT_OVERLAY_SETTINGS.excludedHostnames
  };
}
