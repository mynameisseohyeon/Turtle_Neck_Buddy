export type OverlayReminderPayload = {
  reminderId: string;
  triggeredAt: string;
};

export type OverlayPosition = "bottom-right";

export type OverlaySettings = {
  overlayEnabled: boolean;
  overlayPosition: OverlayPosition;
  excludedHostnames: string[];
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

export type OverlayMessage = BackgroundToOverlayMessage | OverlayToBackgroundMessage;
