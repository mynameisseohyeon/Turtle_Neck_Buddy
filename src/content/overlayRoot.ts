import overlayStyle from "./overlay.css?inline";
import type {
  BackgroundToOverlayMessage,
  OverlaySettings,
  ReminderIntervalMinutes
} from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const OVERLAY_SETTINGS_STORAGE_KEY = "turtle-neck-buddy-overlay-settings";
const STRETCH_REMINDER_TEXT = "스트레칭 시간이야";
const IDLE_FRAME_INTERVAL_MS = 620;
const ALERT_FRAME_INTERVAL_MS = 90;
const REACTION_FRAME_INTERVAL_MS = 70;
const NECK_REACTION_COOLDOWN_MS = 2400;
const REMINDER_INTERVAL_OPTIONS: ReminderIntervalMinutes[] = [30, 50, 60];
const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  overlayPosition: "bottom-right",
  reminderIntervalMinutes: 50,
  excludedHostnames: []
};

const FRAMES = {
  neckIn: [
    "assets/turtle/frames/neck_in/neck_in_01.png",
    "assets/turtle/frames/neck_in/neck_in_02.png",
    "assets/turtle/frames/neck_in/neck_in_03.png",
    "assets/turtle/frames/neck_in/neck_in_04.png",
    "assets/turtle/frames/neck_in/neck_in_05.png",
    "assets/turtle/frames/neck_in/neck_in_06.png",
    "assets/turtle/frames/neck_in/neck_in_07.png",
    "assets/turtle/frames/neck_in/neck_in_08.png"
  ],
  neckOut: [
    "assets/turtle/frames/neck_out/neck_out_01.png",
    "assets/turtle/frames/neck_out/neck_out_02.png",
    "assets/turtle/frames/neck_out/neck_out_03.png",
    "assets/turtle/frames/neck_out/neck_out_04.png",
    "assets/turtle/frames/neck_out/neck_out_05.png",
    "assets/turtle/frames/neck_out/neck_out_06.png",
    "assets/turtle/frames/neck_out/neck_out_07.png",
    "assets/turtle/frames/neck_out/neck_out_08.png"
  ]
} as const;

let overlayState: OverlayViewState = INITIAL_OVERLAY_VIEW_STATE;
let overlaySettings: OverlaySettings = DEFAULT_OVERLAY_SETTINGS;
let bubbleMode: "reminder" | "settings" = "reminder";
let ambientTimerId: number | undefined;
let reactionTimerId: number | undefined;
let ambientFrameIndex = 0;
let isReacting = false;
let nextNeckReactionAt = 0;

function normalizeOverlaySettings(value: unknown): OverlaySettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_OVERLAY_SETTINGS;
  }

  const candidate = value as Partial<OverlaySettings>;
  const overlayPosition =
    candidate.overlayPosition === "bottom-left" || candidate.overlayPosition === "bottom-right"
      ? candidate.overlayPosition
      : DEFAULT_OVERLAY_SETTINGS.overlayPosition;
  const reminderIntervalMinutes = REMINDER_INTERVAL_OPTIONS.includes(
    candidate.reminderIntervalMinutes as ReminderIntervalMinutes
  )
    ? (candidate.reminderIntervalMinutes as ReminderIntervalMinutes)
    : DEFAULT_OVERLAY_SETTINGS.reminderIntervalMinutes;

  return {
    overlayEnabled:
      typeof candidate.overlayEnabled === "boolean"
        ? candidate.overlayEnabled
        : DEFAULT_OVERLAY_SETTINGS.overlayEnabled,
    overlayPosition,
    reminderIntervalMinutes,
    excludedHostnames: Array.isArray(candidate.excludedHostnames)
      ? candidate.excludedHostnames.filter((hostname) => typeof hostname === "string")
      : DEFAULT_OVERLAY_SETTINGS.excludedHostnames
  };
}

function getRuntimeAssetUrl(path: string) {
  return chrome.runtime.getURL(path);
}

function setMascotFrame(mascot: HTMLImageElement, framePath: string) {
  mascot.src = getRuntimeAssetUrl(framePath);
}

function clearAmbientAnimation() {
  if (ambientTimerId === undefined) {
    return;
  }

  window.clearInterval(ambientTimerId);
  ambientTimerId = undefined;
}

function clearReactionAnimation() {
  if (reactionTimerId === undefined) {
    return;
  }

  window.clearInterval(reactionTimerId);
  reactionTimerId = undefined;
}

async function loadOverlaySettings() {
  const storedSettings = await chrome.storage.local.get(OVERLAY_SETTINGS_STORAGE_KEY);
  overlaySettings = normalizeOverlaySettings(storedSettings[OVERLAY_SETTINGS_STORAGE_KEY]);
}

async function updateOverlaySettings(nextSettings: OverlaySettings) {
  overlaySettings = nextSettings;
  await chrome.storage.local.set({
    [OVERLAY_SETTINGS_STORAGE_KEY]: nextSettings
  });
  renderOverlay();
}

function startAmbientAnimation(mascot: HTMLImageElement) {
  clearAmbientAnimation();

  const frames = overlayState.visibilityState === "alert" ? FRAMES.neckOut : FRAMES.neckIn;
  const interval = overlayState.visibilityState === "alert" ? ALERT_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS;
  ambientFrameIndex = 0;
  setMascotFrame(mascot, frames[ambientFrameIndex]);

  ambientTimerId = window.setInterval(() => {
    if (isReacting) {
      return;
    }

    if (overlayState.visibilityState === "alert" && ambientFrameIndex >= frames.length - 1) {
      return;
    }

    ambientFrameIndex = (ambientFrameIndex + 1) % frames.length;
    setMascotFrame(mascot, frames[ambientFrameIndex]);
  }, interval);
}

function playNeckReaction(mascot: HTMLImageElement) {
  const now = Date.now();

  if (isReacting || now < nextNeckReactionAt || overlayState.visibilityState === "hidden") {
    return;
  }

  const reactionFrames = [...FRAMES.neckIn, ...FRAMES.neckOut];
  let reactionFrameIndex = 0;
  isReacting = true;
  nextNeckReactionAt = now + NECK_REACTION_COOLDOWN_MS;
  clearReactionAnimation();
  setMascotFrame(mascot, reactionFrames[reactionFrameIndex]);

  reactionTimerId = window.setInterval(() => {
    reactionFrameIndex += 1;

    if (reactionFrameIndex >= reactionFrames.length) {
      clearReactionAnimation();
      isReacting = false;
      startAmbientAnimation(mascot);
      return;
    }

    setMascotFrame(mascot, reactionFrames[reactionFrameIndex]);
  }, REACTION_FRAME_INTERVAL_MS);
}

function createOverlayHost() {
  const existingHost = document.getElementById(OVERLAY_HOST_ID);

  if (existingHost?.shadowRoot) {
    return existingHost.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = OVERLAY_HOST_ID;
  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = overlayStyle;
  shadowRoot.append(style);
  document.documentElement.append(host);

  return shadowRoot;
}

function renderOverlay() {
  const shadowRoot = createOverlayHost();
  const currentState = overlayState.visibilityState;
  const host = shadowRoot.host as HTMLElement;
  host.dataset.position = overlaySettings.overlayPosition;

  shadowRoot.querySelector("[data-overlay-app]")?.remove();

  const overlay = document.createElement("section");
  overlay.dataset.overlayApp = "true";
  overlay.className = "turtle-overlay";
  overlay.dataset.state = currentState;
  overlay.setAttribute("aria-hidden", "true");

  const mascot = document.createElement("img");
  mascot.className = "turtle-overlay-mascot";
  mascot.alt = "";
  mascot.draggable = false;

  const mascotStage = document.createElement("div");
  mascotStage.className = "turtle-overlay-mascot-stage";
  mascotStage.addEventListener("pointerenter", () => playNeckReaction(mascot));
  mascotStage.addEventListener("click", () => {
    bubbleMode = bubbleMode === "settings" ? "reminder" : "settings";
    renderOverlay();
  });

  const bubble = document.createElement("div");
  bubble.className = "turtle-overlay-bubble";

  if (bubbleMode === "settings") {
    bubble.dataset.mode = "settings";
    bubble.append(createSettingsBubbleContent());
  } else {
    bubble.textContent = overlayState.message || STRETCH_REMINDER_TEXT;
  }

  mascotStage.append(mascot);
  overlay.append(bubble, mascotStage);
  shadowRoot.append(overlay);

  if (currentState === "hidden") {
    setMascotFrame(mascot, FRAMES.neckIn[0]);
    return;
  }

  startAmbientAnimation(mascot);
}

function showReminder() {
  overlayState = {
    visibilityState: "alert",
    turtleState: "idle",
    message: STRETCH_REMINDER_TEXT
  };
  renderOverlay();
}

function hideOverlay() {
  clearReactionAnimation();
  clearAmbientAnimation();
  isReacting = false;
  overlayState = {
    ...overlayState,
    visibilityState: "hidden",
    message: ""
  };
  renderOverlay();
}

function createSettingsBubbleContent() {
  const settings = document.createElement("div");
  settings.className = "turtle-overlay-settings";

  const title = document.createElement("strong");
  title.className = "turtle-overlay-settings-title";
  title.textContent = "스트레칭 설정";

  const enabledLabel = document.createElement("span");
  enabledLabel.className = "turtle-overlay-settings-label";
  enabledLabel.textContent = "알림";

  const enabledButton = document.createElement("button");
  enabledButton.type = "button";
  enabledButton.className = "turtle-overlay-toggle";
  enabledButton.dataset.active = String(overlaySettings.overlayEnabled);
  enabledButton.textContent = overlaySettings.overlayEnabled ? "ON" : "OFF";
  enabledButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void updateOverlaySettings({
      ...overlaySettings,
      overlayEnabled: !overlaySettings.overlayEnabled
    });
  });

  const positionLabel = document.createElement("span");
  positionLabel.className = "turtle-overlay-settings-label";
  positionLabel.textContent = "위치";

  const positionGroup = document.createElement("div");
  positionGroup.className = "turtle-overlay-segment";
  [
    { label: "왼쪽", value: "bottom-left" },
    { label: "오른쪽", value: "bottom-right" }
  ].forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "turtle-overlay-segment-button";
    button.dataset.active = String(overlaySettings.overlayPosition === option.value);
    button.textContent = option.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      void updateOverlaySettings({
        ...overlaySettings,
        overlayPosition: option.value as OverlaySettings["overlayPosition"]
      });
    });
    positionGroup.append(button);
  });

  const intervalLabel = document.createElement("span");
  intervalLabel.className = "turtle-overlay-settings-label";
  intervalLabel.textContent = "주기";

  const intervalGroup = document.createElement("div");
  intervalGroup.className = "turtle-overlay-segment";
  REMINDER_INTERVAL_OPTIONS.forEach((minutes) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "turtle-overlay-segment-button";
    button.dataset.active = String(overlaySettings.reminderIntervalMinutes === minutes);
    button.textContent = `${minutes}분`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      void updateOverlaySettings({
        ...overlaySettings,
        reminderIntervalMinutes: minutes as ReminderIntervalMinutes
      });
    });
    intervalGroup.append(button);
  });

  settings.append(title, enabledLabel, enabledButton, positionLabel, positionGroup, intervalLabel, intervalGroup);

  return settings;
}

chrome.runtime.onMessage.addListener((message: BackgroundToOverlayMessage) => {
  if (message.type === "SHOW_STRETCH_REMINDER") {
    showReminder();
  }

  if (message.type === "HIDE_STRETCH_REMINDER") {
    hideOverlay();
  }

  return undefined;
});

void loadOverlaySettings().then(renderOverlay);
