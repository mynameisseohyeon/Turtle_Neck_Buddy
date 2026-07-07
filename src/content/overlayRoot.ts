import overlayStyle from "./overlay.css?inline";
import { TURTLE_MESSAGES } from "../shared/messages";
import type { BackgroundToOverlayMessage } from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const DEFAULT_REMINDER_MESSAGE = "목 쉬는 시간이에요.";

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
  overlay.setAttribute("aria-live", "polite");

  const card = document.createElement("div");
  card.className = "turtle-overlay-card";

  const mascot = document.createElement("img");
  mascot.className = "turtle-overlay-mascot";
  mascot.alt = "";
  mascot.draggable = false;
  mascot.src = chrome.runtime.getURL("assets/turtle/frames/idle/idle_01.png");

  const message = document.createElement("p");
  message.className = "turtle-overlay-message";
  message.textContent = overlayState.message || DEFAULT_REMINDER_MESSAGE;

  const actions = document.createElement("div");
  actions.className = "turtle-overlay-actions";

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "turtle-overlay-button turtle-overlay-button-primary";
  startButton.textContent = "30초 시작";
  startButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "START_STRETCH_TIMER",
      payload: { durationSeconds: 30 }
    });
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "turtle-overlay-button";
  closeButton.textContent = "닫기";
  closeButton.addEventListener("click", hideOverlay);

  actions.append(startButton, closeButton);
  card.append(mascot, message, actions);
  overlay.append(card);
  shadowRoot.append(overlay);
}

function showReminder() {
  overlayState = {
    visibilityState: "alert",
    turtleState: "alert",
    message: TURTLE_MESSAGES.alert
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
