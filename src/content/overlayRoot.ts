import overlayStyle from "./overlay.css?inline";
import type { BackgroundToOverlayMessage } from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const TURTLE_ONLY_FRAME = "assets/turtle/frames/quiet/quiet_01.png";
const STRETCH_REMINDER_TEXT = "스트레칭 시간이야";

let overlayState: OverlayViewState = INITIAL_OVERLAY_VIEW_STATE;

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
  mascot.src = chrome.runtime.getURL(TURTLE_ONLY_FRAME);

  const bubble = document.createElement("p");
  bubble.className = "turtle-overlay-bubble";
  bubble.textContent = overlayState.message || STRETCH_REMINDER_TEXT;

  overlay.append(bubble, mascot);
  shadowRoot.append(overlay);
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
