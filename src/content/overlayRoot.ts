import overlayStyle from "./overlay.css?inline";
import type { BackgroundToOverlayMessage } from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const STRETCH_REMINDER_TEXT = "스트레칭 시간이야";
const IDLE_FRAME_INTERVAL_MS = 520;
const ALERT_FRAME_INTERVAL_MS = 360;
const REACTION_FRAME_INTERVAL_MS = 70;
const NECK_REACTION_COOLDOWN_MS = 2400;

const FRAMES = {
  idle: [
    "assets/turtle/frames/quiet/quiet_01.png",
    "assets/turtle/frames/quiet/quiet_02.png",
    "assets/turtle/frames/quiet/quiet_03.png",
    "assets/turtle/frames/quiet/quiet_04.png"
  ],
  alert: [
    "assets/turtle/frames/alert/alert_01.png",
    "assets/turtle/frames/alert/alert_02.png",
    "assets/turtle/frames/alert/alert_03.png",
    "assets/turtle/frames/alert/alert_04.png"
  ],
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
let ambientTimerId: number | undefined;
let reactionTimerId: number | undefined;
let ambientFrameIndex = 0;
let isReacting = false;
let nextNeckReactionAt = 0;

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

function startAmbientAnimation(mascot: HTMLImageElement) {
  clearAmbientAnimation();

  const frames = overlayState.visibilityState === "alert" ? FRAMES.alert : FRAMES.idle;
  const interval = overlayState.visibilityState === "alert" ? ALERT_FRAME_INTERVAL_MS : IDLE_FRAME_INTERVAL_MS;
  ambientFrameIndex = 0;
  setMascotFrame(mascot, frames[ambientFrameIndex]);

  ambientTimerId = window.setInterval(() => {
    if (isReacting) {
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

  const bubble = document.createElement("p");
  bubble.className = "turtle-overlay-bubble";
  bubble.textContent = overlayState.message || STRETCH_REMINDER_TEXT;

  mascotStage.append(mascot);
  overlay.append(bubble, mascotStage);
  shadowRoot.append(overlay);

  if (currentState === "hidden") {
    setMascotFrame(mascot, FRAMES.idle[0]);
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

chrome.runtime.onMessage.addListener((message: BackgroundToOverlayMessage) => {
  if (message.type === "SHOW_STRETCH_REMINDER") {
    showReminder();
  }

  if (message.type === "HIDE_STRETCH_REMINDER") {
    hideOverlay();
  }

  return undefined;
});

renderOverlay();
