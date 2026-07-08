import overlayStyle from "./overlay.css?inline";
import type {
  BackgroundToOverlayMessage,
  OverlayLanguage,
  OverlaySettings,
} from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const OVERLAY_SETTINGS_STORAGE_KEY = "turtle-neck-buddy-overlay-settings";
const STRETCH_REMINDER_TEXT = "Time to stretch.";
const IDLE_FRAME_INTERVAL_MS = 620;
const ALERT_FRAME_INTERVAL_MS = 90;
const REACTION_FRAME_INTERVAL_MS = 70;
const NECK_REACTION_COOLDOWN_MS = 2400;
const MIN_REMINDER_INTERVAL_MINUTES = 10;
const MAX_REMINDER_INTERVAL_MINUTES = 180;
const REMINDER_INTERVAL_STEP_MINUTES = 10;
const OVERLAY_LANGUAGE_OPTIONS: OverlayLanguage[] = ["en", "ko", "ja", "zh", "es"];
const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  overlayPosition: "bottom-right",
  reminderIntervalMinutes: 30,
  language: "en",
  customPosition: null,
  lastReminderShownAt: null,
  excludedHostnames: []
};
const INITIAL_VISIBLE_OVERLAY_STATE: OverlayViewState = {
  visibilityState: "peeking",
  turtleState: "idle",
  message: STRETCH_REMINDER_TEXT
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

const OVERLAY_COPY: Record<
  OverlayLanguage,
  {
    reminder: string;
    settingsTitle: string;
    enabledLabel: string;
    positionLabel: string;
    intervalLabel: string;
    languageLabel: string;
    left: string;
    right: string;
    minutes: string;
  }
> = {
  en: {
    reminder: "Time to stretch.",
    settingsTitle: "Stretch settings",
    enabledLabel: "Alert",
    positionLabel: "Side",
    intervalLabel: "Every",
    languageLabel: "Lang",
    left: "Left",
    right: "Right",
    minutes: "min"
  },
  ko: {
    reminder: "스트레칭 시간이야.",
    settingsTitle: "스트레칭 설정",
    enabledLabel: "알림",
    positionLabel: "위치",
    intervalLabel: "주기",
    languageLabel: "언어",
    left: "왼쪽",
    right: "오른쪽",
    minutes: "분"
  },
  ja: {
    reminder: "ストレッチの時間だよ。",
    settingsTitle: "ストレッチ設定",
    enabledLabel: "通知",
    positionLabel: "位置",
    intervalLabel: "間隔",
    languageLabel: "言語",
    left: "左",
    right: "右",
    minutes: "分"
  },
  zh: {
    reminder: "该伸展一下了。",
    settingsTitle: "伸展设置",
    enabledLabel: "提醒",
    positionLabel: "位置",
    intervalLabel: "间隔",
    languageLabel: "语言",
    left: "左",
    right: "右",
    minutes: "分钟"
  },
  es: {
    reminder: "Hora de estirarte.",
    settingsTitle: "Ajustes",
    enabledLabel: "Aviso",
    positionLabel: "Lado",
    intervalLabel: "Cada",
    languageLabel: "Idioma",
    left: "Izq.",
    right: "Der.",
    minutes: "min"
  }
};

let overlayState: OverlayViewState = INITIAL_OVERLAY_VIEW_STATE;
let overlaySettings: OverlaySettings = DEFAULT_OVERLAY_SETTINGS;
let bubbleMode: "reminder" | "settings" = "reminder";
let ambientTimerId: number | undefined;
let reactionTimerId: number | undefined;
let ambientFrameIndex = 0;
let isReacting = false;
let isDragging = false;
let didJustDrag = false;
let dragOffset = { x: 0, y: 0 };
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
  const reminderIntervalMinutes = normalizeReminderIntervalMinutes(candidate.reminderIntervalMinutes);

  return {
    overlayEnabled:
      typeof candidate.overlayEnabled === "boolean"
        ? candidate.overlayEnabled
        : DEFAULT_OVERLAY_SETTINGS.overlayEnabled,
    overlayPosition,
    reminderIntervalMinutes,
    language: isOverlayLanguage(candidate.language) ? candidate.language : DEFAULT_OVERLAY_SETTINGS.language,
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

function normalizeCustomPosition(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<NonNullable<OverlaySettings["customPosition"]>>;

  if (typeof candidate.xPercent !== "number" || typeof candidate.yPercent !== "number") {
    return null;
  }

  return {
    xPercent: Math.min(95, Math.max(5, candidate.xPercent)),
    yPercent: Math.min(95, Math.max(5, candidate.yPercent))
  };
}

function getOverlayCopy() {
  return OVERLAY_COPY[overlaySettings.language] ?? OVERLAY_COPY.en;
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

async function saveCustomPositionFromPointer(clientX: number, clientY: number) {
  const xPercent = (clientX / window.innerWidth) * 100;
  const yPercent = (clientY / window.innerHeight) * 100;
  await updateOverlaySettings({
    ...overlaySettings,
    customPosition: normalizeCustomPosition({ xPercent, yPercent })
  });
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

  if (isDragging || isReacting || now < nextNeckReactionAt || overlayState.visibilityState === "hidden") {
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

  if (overlaySettings.customPosition) {
    host.dataset.customPosition = "true";
    host.style.left = `${overlaySettings.customPosition.xPercent}%`;
    host.style.top = `${overlaySettings.customPosition.yPercent}%`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  } else {
    delete host.dataset.customPosition;
    host.style.removeProperty("left");
    host.style.removeProperty("top");
    host.style.removeProperty("right");
    host.style.removeProperty("bottom");
  }

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
  mascotStage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    const hostRect = host.getBoundingClientRect();
    isDragging = true;
    dragOffset = {
      x: event.clientX - hostRect.left,
      y: event.clientY - hostRect.top
    };
    mascotStage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  mascotStage.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const x = Math.min(window.innerWidth - 24, Math.max(24, event.clientX - dragOffset.x));
    const y = Math.min(window.innerHeight - 24, Math.max(24, event.clientY - dragOffset.y));
    host.dataset.customPosition = "true";
    host.style.left = `${x}px`;
    host.style.top = `${y}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  });
  mascotStage.addEventListener("pointerup", (event) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    didJustDrag = true;
    mascotStage.releasePointerCapture(event.pointerId);
    void saveCustomPositionFromPointer(event.clientX - dragOffset.x, event.clientY - dragOffset.y);
    window.setTimeout(() => {
      didJustDrag = false;
    }, 0);
  });
  mascotStage.addEventListener("click", () => {
    if (isDragging || didJustDrag) {
      return;
    }

    bubbleMode = bubbleMode === "settings" ? "reminder" : "settings";
    renderOverlay();
  });

  const bubble = document.createElement("div");
  bubble.className = "turtle-overlay-bubble";

  if (bubbleMode === "settings") {
    bubble.dataset.mode = "settings";
    bubble.append(createSettingsBubbleContent());
  } else {
    bubble.textContent = overlayState.message || getOverlayCopy().reminder;
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
    message: getOverlayCopy().reminder
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
  const copy = getOverlayCopy();
  const settings = document.createElement("div");
  settings.className = "turtle-overlay-settings";

  const title = document.createElement("strong");
  title.className = "turtle-overlay-settings-title";
  title.textContent = copy.settingsTitle;

  const enabledLabel = document.createElement("span");
  enabledLabel.className = "turtle-overlay-settings-label";
  enabledLabel.textContent = copy.enabledLabel;

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
  positionLabel.textContent = copy.positionLabel;

  const positionGroup = document.createElement("div");
  positionGroup.className = "turtle-overlay-segment";
  [
    { label: copy.left, value: "bottom-left" },
    { label: copy.right, value: "bottom-right" }
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
  intervalLabel.textContent = copy.intervalLabel;

  const intervalGroup = document.createElement("div");
  intervalGroup.className = "turtle-overlay-stepper";
  const decreaseButton = document.createElement("button");
  decreaseButton.type = "button";
  decreaseButton.className = "turtle-overlay-stepper-button";
  decreaseButton.textContent = "-";
  decreaseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void updateOverlaySettings({
      ...overlaySettings,
      reminderIntervalMinutes: normalizeReminderIntervalMinutes(
        overlaySettings.reminderIntervalMinutes - REMINDER_INTERVAL_STEP_MINUTES
      )
    });
  });
  const intervalValue = document.createElement("span");
  intervalValue.className = "turtle-overlay-stepper-value";
  intervalValue.textContent = `${overlaySettings.reminderIntervalMinutes}${copy.minutes}`;
  const increaseButton = document.createElement("button");
  increaseButton.type = "button";
  increaseButton.className = "turtle-overlay-stepper-button";
  increaseButton.textContent = "+";
  increaseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    void updateOverlaySettings({
      ...overlaySettings,
      reminderIntervalMinutes: normalizeReminderIntervalMinutes(
        overlaySettings.reminderIntervalMinutes + REMINDER_INTERVAL_STEP_MINUTES
      )
    });
  });
  intervalGroup.append(decreaseButton, intervalValue, increaseButton);

  const languageLabel = document.createElement("span");
  languageLabel.className = "turtle-overlay-settings-label";
  languageLabel.textContent = copy.languageLabel;

  const languageGroup = document.createElement("div");
  languageGroup.className = "turtle-overlay-segment turtle-overlay-language-segment";
  OVERLAY_LANGUAGE_OPTIONS.forEach((language) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "turtle-overlay-segment-button";
    button.dataset.active = String(overlaySettings.language === language);
    button.textContent = language.toUpperCase();
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      void updateOverlaySettings({
        ...overlaySettings,
        language
      });
    });
    languageGroup.append(button);
  });

  settings.append(
    title,
    enabledLabel,
    enabledButton,
    positionLabel,
    positionGroup,
    intervalLabel,
    intervalGroup,
    languageLabel,
    languageGroup
  );

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

void loadOverlaySettings().then(() => {
  overlayState = INITIAL_VISIBLE_OVERLAY_STATE;
  renderOverlay();
});
