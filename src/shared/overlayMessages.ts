export type OverlayReminderPayload = {
  reminderId: string;
  triggeredAt: string;
};

export type OverlayPosition = "bottom-right" | "bottom-left";

export type OverlayLanguage = "en" | "ko" | "ja" | "zh" | "es";

export type OverlayCustomPosition = {
  xPercent: number;
  yPercent: number;
};

export type OverlaySettings = {
  overlayEnabled: boolean;
  overlayPosition: OverlayPosition;
  reminderIntervalMinutes: number;
  language: OverlayLanguage;
  customPosition: OverlayCustomPosition | null;
  lastReminderShownAt: string | null;
  excludedHostnames: string[];
};

export type CurrentSiteOverlayPermissionState = {
  isSupported: boolean;
  origin: string | null;
  hostname: string | null;
  granted: boolean;
  reason?: "unsupported-url" | "permission-unavailable" | "unknown-error";
};

export type BackgroundToOverlayMessage =
  | {
      type: "SHOW_STRETCH_REMINDER";
      payload: OverlayReminderPayload;
    }
  | {
      type: "HIDE_STRETCH_REMINDER";
    };

export type OverlayToBackgroundMessage =
  | {
      type: "START_STRETCH_TIMER";
      payload: {
        durationSeconds: number;
      };
    }
  | {
      type: "COMPLETE_STRETCH";
      payload: {
        completedAt: string;
      };
    }
  | {
      type: "SNOOZE_STRETCH_REMINDER";
      payload: {
        snoozeMinutes: number;
      };
    };

export type PopupToBackgroundMessage =
  | {
      type: "GET_CURRENT_SITE_OVERLAY_PERMISSION";
    }
  | {
      type: "REQUEST_CURRENT_SITE_OVERLAY_PERMISSION";
    }
  | {
      type: "PREVIEW_OVERLAY_ON_CURRENT_TAB";
    };

export type BackgroundToPopupMessage =
  | {
      type: "CURRENT_SITE_OVERLAY_PERMISSION";
      payload: CurrentSiteOverlayPermissionState;
    }
  | {
      type: "OVERLAY_PREVIEW_RESULT";
      payload: {
        ok: boolean;
        reason?: "permission-required" | "unsupported-url" | "injection-failed";
      };
    };

export type OverlayMessage = BackgroundToOverlayMessage | OverlayToBackgroundMessage;

export type PopupBackgroundMessage = PopupToBackgroundMessage | BackgroundToPopupMessage;
