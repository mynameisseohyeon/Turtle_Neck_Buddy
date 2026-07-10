import overlayStyle from "./overlay.css?inline";
import type {
  BackgroundToOverlayMessage,
  OverlayLanguage,
  OverlaySettings,
} from "../shared/overlayMessages";
import { INITIAL_OVERLAY_VIEW_STATE, type OverlayViewState } from "../shared/overlayState";

const OVERLAY_HOST_ID = "turtle-neck-buddy-overlay-root";
const OVERLAY_SETTINGS_STORAGE_KEY = "turtle-neck-buddy-overlay-settings";
const IDLE_FRAME_INTERVAL_MS = 520;
const PEEKING_FRAME_INTERVAL_MS = 180;
const ALERT_FRAME_INTERVAL_MS = 90;
const STRETCH_FRAME_INTERVAL_MS = 320;
const SUCCESS_FRAME_INTERVAL_MS = 180;
const REACTION_FRAME_INTERVAL_MS = 70;
const DRAG_FRAME_INTERVAL_MS = 80;
const NECK_REACTION_COOLDOWN_MS = 2400;
const STRETCH_TOTAL_SECONDS = 30;
const STRETCH_PHASE_SECONDS = 10;
const SUCCESS_VISIBLE_MS = 3500;
const MIN_REMINDER_INTERVAL_MINUTES = 10;
const MAX_REMINDER_INTERVAL_MINUTES = 180;
const REMINDER_INTERVAL_STEP_MINUTES = 10;
const DEFAULT_TURTLE_SIZE = 50;
const MIN_TURTLE_SIZE = 20;
const MAX_TURTLE_SIZE = 80;
const TURTLE_SIZE_SCALE_VERSION = 2;
const DEFAULT_OVERLAY_CUSTOM_POSITION = {
  xPercent: 100,
  yPercent: 18
};
const BASE_TURTLE_WIDTH_PX = 166;
const BASE_TURTLE_HEIGHT_PX = 263;
const BASE_TURTLE_STAGE_WIDTH_PX = 470;
const TURTLE_STAGE_HEADROOM_PX = 10;
const MAX_TURTLE_FRAME_SCALE = 1.3;
const EDGE_SNAP_THRESHOLD_PX = 24;
const OVERLAY_LANGUAGE_OPTIONS: OverlayLanguage[] = ["en", "ko", "ja", "zh", "es"];
const OVERLAY_LANGUAGE_FLAGS: Record<OverlayLanguage, { flag: string; label: string }> = {
  en: { flag: "🇺🇸", label: "English" },
  ko: { flag: "🇰🇷", label: "한국어" },
  ja: { flag: "🇯🇵", label: "日本語" },
  zh: { flag: "🇨🇳", label: "中文" },
  es: { flag: "🇪🇸", label: "Español" }
};
const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  overlayEnabled: true,
  overlayPosition: "bottom-right",
  reminderIntervalMinutes: 30,
  language: "en",
  turtleSize: DEFAULT_TURTLE_SIZE,
  turtleSizeScaleVersion: TURTLE_SIZE_SCALE_VERSION,
  customPosition: DEFAULT_OVERLAY_CUSTOM_POSITION,
  lastReminderShownAt: null,
  excludedHostnames: []
};
const WAITING_OVERLAY_STATE: OverlayViewState = {
  visibilityState: "peeking",
  turtleState: "idle",
  message: ""
};

const FRAMES = {
  idle: [
    "assets/turtle/frames/idle/idle_01.png",
    "assets/turtle/frames/idle/idle_02.png",
    "assets/turtle/frames/idle/idle_03.png",
    "assets/turtle/frames/idle/idle_04.png"
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
  ],
  alert: [
    "assets/turtle/frames/alert/alert_01.png",
    "assets/turtle/frames/alert/alert_02.png",
    "assets/turtle/frames/alert/alert_03.png",
    "assets/turtle/frames/alert/alert_04.png"
  ],
  drag: [
    "assets/turtle/frames/drag/drag_01.png",
    "assets/turtle/frames/drag/drag_02.png",
    "assets/turtle/frames/drag/drag_03.png",
    "assets/turtle/frames/drag/drag_04.png",
    "assets/turtle/frames/drag/drag_05.png",
    "assets/turtle/frames/drag/drag_06.png",
    "assets/turtle/frames/drag/drag_07.png",
    "assets/turtle/frames/drag/drag_08.png",
    "assets/turtle/frames/drag/drag_09.png"
  ],
  chinTuck: [
    "assets/turtle/frames/chin_tuck/chin_tuck_01.png",
    "assets/turtle/frames/chin_tuck/chin_tuck_02.png",
    "assets/turtle/frames/chin_tuck/chin_tuck_03.png",
    "assets/turtle/frames/chin_tuck/chin_tuck_04.png"
  ],
  neckTilt: [
    "assets/turtle/frames/neck_tilt/neck_tilt_01.png",
    "assets/turtle/frames/neck_tilt/neck_tilt_02.png",
    "assets/turtle/frames/neck_tilt/neck_tilt_03.png"
  ],
  shoulderRoll: [
    "assets/turtle/frames/shoulder_roll/shoulder_roll_01.png",
    "assets/turtle/frames/shoulder_roll/shoulder_roll_02.png",
    "assets/turtle/frames/shoulder_roll/shoulder_roll_03.png",
    "assets/turtle/frames/shoulder_roll/shoulder_roll_04.png"
  ],
  success: [
    "assets/turtle/frames/success/success_01.png",
    "assets/turtle/frames/success/success_02.png",
    "assets/turtle/frames/success/success_03.png",
    "assets/turtle/frames/success/success_04.png"
  ]
} as const;

const PEEKING_AMBIENT_FRAMES = [
  FRAMES.neckIn[7],
  FRAMES.neckIn[7],
  FRAMES.neckIn[7],
  FRAMES.neckIn[6],
  FRAMES.neckIn[5],
  FRAMES.neckIn[4],
  FRAMES.neckIn[3],
  FRAMES.neckIn[3],
  FRAMES.neckIn[3],
  FRAMES.neckIn[4],
  FRAMES.neckIn[5],
  FRAMES.neckIn[6]
];

const FRAME_VISUAL_SCALES = {
  idle: 1.3,
  alert: 1.3,
  drag: 1,
  chinTuck: 0.91,
  neckTilt: 1,
  shoulderRoll: 0.95,
  success: 1.18,
  peeking: 1
} as const;

const OVERLAY_COPY: Record<
  OverlayLanguage,
  {
    reminder: string;
    startStretchLabel: string;
    stretchDoneLabel: string;
    stretchSuccess: string;
    stretchTimerLabel: string;
    stretchPhases: Array<{
      title: string;
      guide: string;
    }>;
    settingsTitle: string;
    enabledLabel: string;
    positionLabel: string;
    intervalLabel: string;
    nextLabel: string;
    preferencesLabel: string;
    languageLabel: string;
    sizeLabel: string;
    okLabel: string;
    backLabel: string;
    closeLabel: string;
    left: string;
    right: string;
    minutes: string;
  }
> = {
  en: {
    reminder: "Time to stretch!",
    startStretchLabel: "Start 30s",
    stretchDoneLabel: "Done",
    stretchSuccess: "Nice posture!",
    stretchTimerLabel: "Stretch",
    stretchPhases: [
      { title: "Chin tuck", guide: "Look forward and gently tuck your chin." },
      { title: "Neck tilt", guide: "Relax shoulders and tilt your neck slowly." },
      { title: "Shoulder roll", guide: "Open your chest and roll shoulders back." }
    ],
    settingsTitle: "Stretch settings",
    enabledLabel: "Alert",
    positionLabel: "Side",
    intervalLabel: "Every",
    nextLabel: "Next",
    preferencesLabel: "Prefs",
    languageLabel: "Language",
    sizeLabel: "Turtle size",
    okLabel: "OK",
    backLabel: "Back",
    closeLabel: "Close",
    left: "Left",
    right: "Right",
    minutes: "min"
  },
  ko: {
    reminder: "스트레칭 시간이야!",
    startStretchLabel: "30초 시작",
    stretchDoneLabel: "완료",
    stretchSuccess: "좋아요, 목이 한결 편해졌어요!",
    stretchTimerLabel: "스트레칭",
    stretchPhases: [
      { title: "턱 당기기", guide: "시선은 정면, 턱은 살짝 뒤로 당겨요." },
      { title: "목 좌우 기울이기", guide: "어깨는 내리고 목만 천천히 움직여요." },
      { title: "어깨 뒤로 돌리기", guide: "가슴을 펴고 어깨를 뒤로 굴려요." }
    ],
    settingsTitle: "스트레칭 설정",
    enabledLabel: "알림",
    positionLabel: "위치",
    intervalLabel: "주기",
    nextLabel: "다음",
    preferencesLabel: "환경 설정",
    languageLabel: "언어",
    sizeLabel: "거북이 크기",
    okLabel: "OK",
    backLabel: "뒤로",
    closeLabel: "닫기",
    left: "왼쪽",
    right: "오른쪽",
    minutes: "분"
  },
  ja: {
    reminder: "ストレッチの時間だよ！",
    startStretchLabel: "30秒開始",
    stretchDoneLabel: "完了",
    stretchSuccess: "いい姿勢です！",
    stretchTimerLabel: "ストレッチ",
    stretchPhases: [
      { title: "あごを引く", guide: "正面を見て、あごをやさしく引きます。" },
      { title: "首を傾ける", guide: "肩を下げて、首だけゆっくり動かします。" },
      { title: "肩回し", guide: "胸を開いて、肩を後ろへ回します。" }
    ],
    settingsTitle: "ストレッチ設定",
    enabledLabel: "通知",
    positionLabel: "位置",
    intervalLabel: "間隔",
    nextLabel: "次",
    preferencesLabel: "環境設定",
    languageLabel: "言語",
    sizeLabel: "カメの大きさ",
    okLabel: "OK",
    backLabel: "戻る",
    closeLabel: "閉じる",
    left: "左",
    right: "右",
    minutes: "分"
  },
  zh: {
    reminder: "该伸展一下了！",
    startStretchLabel: "开始30秒",
    stretchDoneLabel: "完成",
    stretchSuccess: "姿势好多了！",
    stretchTimerLabel: "伸展",
    stretchPhases: [
      { title: "收下巴", guide: "看向前方，轻轻把下巴往后收。" },
      { title: "左右侧颈", guide: "放松肩膀，慢慢倾斜脖子。" },
      { title: "肩膀后绕", guide: "打开胸口，肩膀向后转动。" }
    ],
    settingsTitle: "伸展设置",
    enabledLabel: "提醒",
    positionLabel: "位置",
    intervalLabel: "间隔",
    nextLabel: "下次",
    preferencesLabel: "偏好设置",
    languageLabel: "语言",
    sizeLabel: "乌龟大小",
    okLabel: "OK",
    backLabel: "返回",
    closeLabel: "关闭",
    left: "左",
    right: "右",
    minutes: "分钟"
  },
  es: {
    reminder: "Hora de estirarte!",
    startStretchLabel: "30s inicio",
    stretchDoneLabel: "Listo",
    stretchSuccess: "Mejor postura!",
    stretchTimerLabel: "Estira",
    stretchPhases: [
      { title: "Mentón atrás", guide: "Mira al frente y lleva el mentón atrás." },
      { title: "Inclina cuello", guide: "Relaja hombros y mueve el cuello lento." },
      { title: "Rueda hombros", guide: "Abre el pecho y rueda hombros atrás." }
    ],
    settingsTitle: "Ajustes",
    enabledLabel: "Aviso",
    positionLabel: "Lado",
    intervalLabel: "Cada",
    nextLabel: "Próx.",
    preferencesLabel: "Preferencias",
    languageLabel: "Idioma",
    sizeLabel: "Tamaño",
    okLabel: "OK",
    backLabel: "Atrás",
    closeLabel: "Cerrar",
    left: "Izq.",
    right: "Der.",
    minutes: "min"
  }
};

let overlayState: OverlayViewState = INITIAL_OVERLAY_VIEW_STATE;
let overlaySettings: OverlaySettings = DEFAULT_OVERLAY_SETTINGS;
let bubbleMode: "reminder" | "settings" | "preferences" = "reminder";
let ambientTimerId: number | undefined;
let reactionTimerId: number | undefined;
let settingsCountdownTimerId: number | undefined;
let stretchTimerId: number | undefined;
let successTimerId: number | undefined;
let ambientFrameIndex = 0;
let pendingReminderIntervalMinutes = DEFAULT_OVERLAY_SETTINGS.reminderIntervalMinutes;
let stretchStartedAt = 0;
let isReacting = false;
let isDragging = false;
let hasDragged = false;
let didJustDrag = false;
let dragOffset = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };
let dragPosition = { x: 0, y: 0 };
let lastDragFramePath: string = FRAMES.drag[4];
let lastDragFrameChangedAt = 0;
let nextNeckReactionAt = 0;
let overlayStopped = false;

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
    turtleSize: normalizeTurtleSize(candidate.turtleSize, candidate.turtleSizeScaleVersion),
    turtleSizeScaleVersion: TURTLE_SIZE_SCALE_VERSION,
    customPosition: normalizeCustomPosition(candidate.customPosition) ?? DEFAULT_OVERLAY_SETTINGS.customPosition,
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
    xPercent: Math.min(100, Math.max(0, candidate.xPercent)),
    yPercent: Math.min(95, Math.max(5, candidate.yPercent))
  };
}

function normalizeTurtleSize(value: unknown, version: unknown = TURTLE_SIZE_SCALE_VERSION) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_OVERLAY_SETTINGS.turtleSize;
  }

  const migratedValue = version === TURTLE_SIZE_SCALE_VERSION ? value : value + 30;
  return Math.min(MAX_TURTLE_SIZE, Math.max(MIN_TURTLE_SIZE, Math.round(migratedValue)));
}

function applyTurtleSizeStyle(
  mascot: HTMLImageElement,
  turtleSize = overlaySettings.turtleSize,
  mascotStage?: HTMLElement
) {
  const turtleSizeScale = 0.7 + (turtleSize - DEFAULT_TURTLE_SIZE) / 100;
  const turtleWidth = Math.round(BASE_TURTLE_WIDTH_PX * turtleSizeScale);
  const turtleHeight = Math.round(BASE_TURTLE_HEIGHT_PX * turtleSizeScale);
  const turtleStageWidth = Math.round(BASE_TURTLE_STAGE_WIDTH_PX * turtleSizeScale);
  mascot.dataset.baseHeight = String(turtleHeight);
  mascot.style.width = "auto";
  mascot.style.maxWidth = "none";
  mascot.style.maxHeight = "none";

  if (mascot.dataset.framePath) {
    applyMascotFrameSize(mascot, mascot.dataset.framePath);
  } else {
    mascot.style.height = `${turtleHeight}px`;
  }

  if (mascotStage) {
    mascotStage.style.width = `${Math.max(turtleWidth, turtleStageWidth)}px`;
    mascotStage.style.height = `${Math.round(turtleHeight * MAX_TURTLE_FRAME_SCALE) + TURTLE_STAGE_HEADROOM_PX}px`;
  }
}

function getMascotFrameScale(framePath: string) {
  if (framePath.includes("/idle/")) {
    return FRAME_VISUAL_SCALES.idle;
  }

  if (framePath.includes("/alert/")) {
    return FRAME_VISUAL_SCALES.alert;
  }

  if (framePath.includes("/drag/")) {
    return FRAME_VISUAL_SCALES.drag;
  }

  if (framePath.includes("/chin_tuck/")) {
    return FRAME_VISUAL_SCALES.chinTuck;
  }

  if (framePath.includes("/neck_tilt/")) {
    return FRAME_VISUAL_SCALES.neckTilt;
  }

  if (framePath.includes("/shoulder_roll/")) {
    return FRAME_VISUAL_SCALES.shoulderRoll;
  }

  if (framePath.includes("/success/")) {
    return FRAME_VISUAL_SCALES.success;
  }

  return FRAME_VISUAL_SCALES.peeking;
}

function applyMascotFrameSize(mascot: HTMLImageElement, framePath: string) {
  const baseHeight = Number(mascot.dataset.baseHeight) || BASE_TURTLE_HEIGHT_PX;
  mascot.style.height = `${Math.round(baseHeight * getMascotFrameScale(framePath))}px`;
}

function getOverlayCopy() {
  return OVERLAY_COPY[overlaySettings.language] ?? OVERLAY_COPY.en;
}

function getRuntimeAssetUrl(path: string) {
  try {
    return chrome.runtime.getURL(path);
  } catch {
    stopOverlayAfterContextInvalidated();
    return null;
  }
}

function setMascotFrame(mascot: HTMLImageElement, framePath: string) {
  const frameUrl = getRuntimeAssetUrl(framePath);

  if (!frameUrl) {
    return false;
  }

  mascot.dataset.framePath = framePath;
  applyMascotFrameSize(mascot, framePath);
  mascot.src = frameUrl;
  return true;
}

function preloadMascotFrames() {
  Object.values(FRAMES)
    .flat()
    .forEach((framePath) => {
      const frameUrl = getRuntimeAssetUrl(framePath);

      if (!frameUrl) {
        return;
      }

      const image = new Image();
      image.decoding = "async";
      image.src = frameUrl;
    });
}

function getDragFramePath(deltaX: number, deltaY: number) {
  if (Math.hypot(deltaX, deltaY) < 3) {
    return FRAMES.drag[4];
  }

  const horizontalIndex = deltaX < -3 ? 0 : deltaX > 3 ? 2 : 1;
  const verticalIndex = deltaY < -3 ? 0 : deltaY > 3 ? 2 : 1;
  return FRAMES.drag[verticalIndex * 3 + horizontalIndex];
}

function setDragFrame(mascot: HTMLImageElement, deltaX: number, deltaY: number) {
  const now = Date.now();
  const nextFramePath = getDragFramePath(deltaX, deltaY);

  if (nextFramePath === lastDragFramePath && now - lastDragFrameChangedAt < DRAG_FRAME_INTERVAL_MS) {
    return;
  }

  lastDragFramePath = nextFramePath;
  lastDragFrameChangedAt = now;
  setMascotFrame(mascot, nextFramePath);
}

function getCurrentStretchPhaseIndex() {
  const remainingSeconds = overlayState.remainingSeconds ?? STRETCH_TOTAL_SECONDS;
  const elapsedSeconds = STRETCH_TOTAL_SECONDS - remainingSeconds;
  return Math.min(2, Math.max(0, Math.floor(elapsedSeconds / STRETCH_PHASE_SECONDS)));
}

function getStretchPhaseFrames() {
  const phaseIndex = getCurrentStretchPhaseIndex();

  if (phaseIndex === 0) {
    return FRAMES.chinTuck;
  }

  if (phaseIndex === 1) {
    return FRAMES.neckTilt;
  }

  return FRAMES.shoulderRoll;
}

function createPingPongFrames<T>(frames: readonly T[]) {
  if (frames.length < 3) {
    return [...frames];
  }

  return [...frames, ...frames.slice(1, -1).reverse()];
}

function getAmbientFrames() {
  if (overlayState.visibilityState === "success") {
    return createPingPongFrames(FRAMES.success);
  }

  if (overlayState.visibilityState === "stretch") {
    return createPingPongFrames(getStretchPhaseFrames());
  }

  if (overlayState.visibilityState === "alert") {
    return FRAMES.alert;
  }

  const isFreelyPositioned =
    overlaySettings.customPosition !== null &&
    overlaySettings.customPosition.xPercent !== 0 &&
    overlaySettings.customPosition.xPercent !== 100;
  return isFreelyPositioned ? createPingPongFrames(FRAMES.idle) : PEEKING_AMBIENT_FRAMES;
}

function getAmbientFrameInterval() {
  if (overlayState.visibilityState === "alert") {
    return ALERT_FRAME_INTERVAL_MS;
  }

  if (overlayState.visibilityState === "stretch") {
    return STRETCH_FRAME_INTERVAL_MS;
  }

  if (overlayState.visibilityState === "success") {
    return SUCCESS_FRAME_INTERVAL_MS;
  }

  const isFreelyPositioned =
    overlaySettings.customPosition !== null &&
    overlaySettings.customPosition.xPercent !== 0 &&
    overlaySettings.customPosition.xPercent !== 100;
  return isFreelyPositioned ? IDLE_FRAME_INTERVAL_MS : PEEKING_FRAME_INTERVAL_MS;
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

function clearSettingsCountdown() {
  if (settingsCountdownTimerId === undefined) {
    return;
  }

  window.clearInterval(settingsCountdownTimerId);
  settingsCountdownTimerId = undefined;
}

function clearStretchTimer() {
  if (stretchTimerId === undefined) {
    return;
  }

  window.clearInterval(stretchTimerId);
  stretchTimerId = undefined;
}

function clearSuccessTimer() {
  if (successTimerId === undefined) {
    return;
  }

  window.clearTimeout(successTimerId);
  successTimerId = undefined;
}

function stopOverlayAfterContextInvalidated() {
  overlayStopped = true;
  clearReactionAnimation();
  clearAmbientAnimation();
  clearSettingsCountdown();
  clearStretchTimer();
  clearSuccessTimer();
  document.getElementById(OVERLAY_HOST_ID)?.remove();
}

async function loadOverlaySettings() {
  try {
    const storedSettings = await chrome.storage.local.get(OVERLAY_SETTINGS_STORAGE_KEY);
    overlaySettings = normalizeOverlaySettings(storedSettings[OVERLAY_SETTINGS_STORAGE_KEY]);
  } catch {
    stopOverlayAfterContextInvalidated();
  }
}

async function updateOverlaySettings(nextSettings: OverlaySettings) {
  if (overlayStopped) {
    return;
  }

  overlaySettings = nextSettings;
  try {
    await chrome.storage.local.set({
      [OVERLAY_SETTINGS_STORAGE_KEY]: nextSettings
    });
  } catch {
    stopOverlayAfterContextInvalidated();
    return;
  }
  renderOverlay();
}

function getEdgeSnapFromBounds(left: number, width: number): OverlaySettings["overlayPosition"] | null {
  if (left <= EDGE_SNAP_THRESHOLD_PX) {
    return "bottom-left";
  }

  if (left + width >= window.innerWidth - EDGE_SNAP_THRESHOLD_PX) {
    return "bottom-right";
  }

  return null;
}

async function saveCustomPositionFromDrag(left: number, stageTop: number, width: number) {
  const edgeSnap = getEdgeSnapFromBounds(left, width);
  const xPercent = edgeSnap === "bottom-left" ? 0 : edgeSnap === "bottom-right" ? 100 : (left / window.innerWidth) * 100;
  const yPercent = (stageTop / window.innerHeight) * 100;
  await updateOverlaySettings({
    ...overlaySettings,
    overlayPosition: edgeSnap ?? overlaySettings.overlayPosition,
    customPosition: normalizeCustomPosition({ xPercent, yPercent })
  });
}

function openSettingsBubble() {
  pendingReminderIntervalMinutes = overlaySettings.reminderIntervalMinutes;
  bubbleMode = "settings";
  renderOverlay();
}

function openPreferencesBubble() {
  bubbleMode = "preferences";
  renderOverlay();
}

function closeSettingsBubble() {
  bubbleMode = "reminder";
  clearSettingsCountdown();
  renderOverlay();
}

function returnToWaitingState() {
  clearReactionAnimation();
  clearAmbientAnimation();
  clearStretchTimer();
  clearSuccessTimer();
  isReacting = false;
  bubbleMode = "reminder";
  overlayState = { ...WAITING_OVERLAY_STATE };
  renderOverlay();
}

function startStretchRoutine() {
  clearSuccessTimer();
  clearStretchTimer();
  clearReactionAnimation();
  clearAmbientAnimation();
  stretchStartedAt = Date.now();
  const copy = getOverlayCopy();
  overlayState = {
    visibilityState: "stretch",
    turtleState: "stretch",
    message: copy.stretchPhases[0].title,
    remainingSeconds: STRETCH_TOTAL_SECONDS
  };
  bubbleMode = "reminder";
  renderOverlay();

  stretchTimerId = window.setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - stretchStartedAt) / 1000);
    const remainingSeconds = Math.max(0, STRETCH_TOTAL_SECONDS - elapsedSeconds);

    if (remainingSeconds <= 0) {
      completeStretchRoutine();
      return;
    }

    const previousPhaseIndex = getCurrentStretchPhaseIndex();
    const phaseIndex = Math.min(2, Math.floor((STRETCH_TOTAL_SECONDS - remainingSeconds) / STRETCH_PHASE_SECONDS));
    overlayState = {
      ...overlayState,
      message: getOverlayCopy().stretchPhases[phaseIndex].title,
      remainingSeconds
    };

    if (phaseIndex !== previousPhaseIndex) {
      renderOverlay();
      return;
    }

    const timer = document
      .getElementById(OVERLAY_HOST_ID)
      ?.shadowRoot?.querySelector<HTMLElement>(".turtle-overlay-stretch-timer");

    if (timer) {
      timer.textContent = formatStopwatchSeconds(remainingSeconds);
    }
  }, 1000);
}

function completeStretchRoutine() {
  clearStretchTimer();
  clearReactionAnimation();
  clearAmbientAnimation();
  clearSuccessTimer();
  overlayState = {
    visibilityState: "success",
    turtleState: "success",
    message: getOverlayCopy().stretchSuccess,
    remainingSeconds: 0
  };
  renderOverlay();
  successTimerId = window.setTimeout(() => {
    returnToWaitingState();
  }, SUCCESS_VISIBLE_MS);
}

function formatStopwatchSeconds(totalSeconds: number) {
  const boundedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getRemainingReminderSeconds() {
  if (!overlaySettings.lastReminderShownAt) {
    return overlaySettings.reminderIntervalMinutes * 60;
  }

  const lastShownAt = Date.parse(overlaySettings.lastReminderShownAt);
  if (!Number.isFinite(lastShownAt)) {
    return overlaySettings.reminderIntervalMinutes * 60;
  }

  const elapsedSeconds = Math.floor((Date.now() - lastShownAt) / 1000);
  return Math.max(0, overlaySettings.reminderIntervalMinutes * 60 - elapsedSeconds);
}

function startSettingsCountdown(display: HTMLElement) {
  clearSettingsCountdown();
  display.textContent = formatStopwatchSeconds(getRemainingReminderSeconds());
  settingsCountdownTimerId = window.setInterval(() => {
    display.textContent = formatStopwatchSeconds(getRemainingReminderSeconds());
  }, 1000);
}

function startAmbientAnimation(mascot: HTMLImageElement) {
  if (overlayStopped) {
    return;
  }

  clearAmbientAnimation();

  const frames = getAmbientFrames();
  const interval = getAmbientFrameInterval();
  ambientFrameIndex = 0;
  if (!setMascotFrame(mascot, frames[ambientFrameIndex])) {
    return;
  }

  ambientTimerId = window.setInterval(() => {
    if (isReacting) {
      return;
    }

    if (overlayState.visibilityState === "alert" && ambientFrameIndex >= frames.length - 1) {
      return;
    }

    ambientFrameIndex = (ambientFrameIndex + 1) % frames.length;
    if (!setMascotFrame(mascot, frames[ambientFrameIndex])) {
      clearAmbientAnimation();
      return;
    }
  }, interval);
}

function playNeckReaction(mascot: HTMLImageElement) {
  if (overlayStopped) {
    return;
  }

  const now = Date.now();

  if (
    isDragging ||
    isReacting ||
    now < nextNeckReactionAt ||
    overlayState.visibilityState === "hidden" ||
    overlayState.visibilityState === "stretch" ||
    overlayState.visibilityState === "success"
  ) {
    return;
  }

  const reactionFrames = [...FRAMES.neckIn, ...[...FRAMES.neckOut].reverse()];
  let reactionFrameIndex = 0;
  isReacting = true;
  nextNeckReactionAt = now + NECK_REACTION_COOLDOWN_MS;
  clearReactionAnimation();
  if (!setMascotFrame(mascot, reactionFrames[reactionFrameIndex])) {
    isReacting = false;
    return;
  }

  reactionTimerId = window.setInterval(() => {
    reactionFrameIndex += 1;

    if (reactionFrameIndex >= reactionFrames.length) {
      clearReactionAnimation();
      isReacting = false;
      startAmbientAnimation(mascot);
      return;
    }

    if (!setMascotFrame(mascot, reactionFrames[reactionFrameIndex])) {
      clearReactionAnimation();
      isReacting = false;
      return;
    }
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

function keepMascotInsideViewport(
  host: HTMLElement,
  overlay: HTMLElement,
  mascot: HTMLImageElement,
  visibilityState: OverlayViewState["visibilityState"]
) {
  if (visibilityState === "hidden") {
    return;
  }

  const mascotRect = mascot.getBoundingClientRect();
  const allowsEdgePeeking = visibilityState === "peeking" && host.dataset.edgeSnapped !== "false";
  let shiftX = 0;
  let shiftY = 0;

  if (!allowsEdgePeeking) {
    if (mascotRect.left < 0) {
      shiftX = -mascotRect.left;
    } else if (mascotRect.right > window.innerWidth) {
      shiftX = window.innerWidth - mascotRect.right;
    }
  }

  if (mascotRect.top < 0) {
    shiftY = -mascotRect.top;
  } else if (mascotRect.bottom > window.innerHeight) {
    shiftY = window.innerHeight - mascotRect.bottom;
  }

  if (shiftX === 0 && shiftY === 0) {
    return;
  }

  const overlayRect = overlay.getBoundingClientRect();

  if (shiftX !== 0) {
    host.style.left = `${overlayRect.left + shiftX}px`;
    host.style.right = "auto";
  }

  if (shiftY !== 0) {
    host.style.top = `${overlayRect.top + shiftY}px`;
    host.style.bottom = "auto";
  }
}

function renderOverlay() {
  if (overlayStopped) {
    return;
  }

  clearSettingsCountdown();
  const shadowRoot = createOverlayHost();
  const currentState = overlayState.visibilityState;
  const host = shadowRoot.host as HTMLElement;
  host.dataset.position = overlaySettings.overlayPosition;

  if (overlaySettings.customPosition) {
    host.dataset.customPosition = "true";
    const edgeSnap =
      overlaySettings.customPosition.xPercent === 0
        ? "bottom-left"
        : overlaySettings.customPosition.xPercent === 100
          ? "bottom-right"
          : null;
    host.dataset.edgeSnapped = String(edgeSnap !== null);
    host.dataset.position = edgeSnap ?? overlaySettings.overlayPosition;
  } else {
    delete host.dataset.customPosition;
    delete host.dataset.edgeSnapped;
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
  applyTurtleSizeStyle(mascot, overlaySettings.turtleSize, mascotStage);
  overlay.style.width = mascotStage.style.width;
  mascotStage.addEventListener("pointerenter", () => playNeckReaction(mascot));
  mascotStage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    host.dataset.edgeSnapped = "false";
    const overlayRect = overlay.getBoundingClientRect();
    const bubbleHeight = bubble?.offsetHeight ?? 0;
    isDragging = true;
    hasDragged = false;
    isReacting = false;
    clearReactionAnimation();
    clearAmbientAnimation();
    mascotStage.dataset.dragging = "true";
    lastDragFramePath = FRAMES.drag[4];
    lastDragFrameChangedAt = 0;
    setMascotFrame(mascot, lastDragFramePath);
    dragOffset = {
      x: event.clientX - overlayRect.left,
      y: event.clientY - (overlayRect.top + bubbleHeight)
    };
    dragStart = {
      x: event.clientX,
      y: event.clientY
    };
    mascotStage.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  mascotStage.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const dragDistance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    if (dragDistance < 4 && !hasDragged) {
      return;
    }

    hasDragged = true;
    setDragFrame(mascot, event.clientX - dragStart.x, event.clientY - dragStart.y);
    const bubbleHeight = bubble?.offsetHeight ?? 0;
    const stageWidth = mascotStage.offsetWidth;
    const stageHeight = mascotStage.offsetHeight;
    const x = Math.min(Math.max(0, window.innerWidth - stageWidth), Math.max(0, event.clientX - dragOffset.x));
    const stageTop = Math.min(
      Math.max(0, window.innerHeight - stageHeight),
      Math.max(0, event.clientY - dragOffset.y)
    );
    const edgeSnap = getEdgeSnapFromBounds(x, stageWidth);
    if (edgeSnap) {
      host.dataset.position = edgeSnap;
    }
    host.dataset.edgeSnapped = String(edgeSnap !== null);
    host.dataset.customPosition = "true";
    host.style.left = `${x}px`;
    host.style.top = `${stageTop - bubbleHeight}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
    dragPosition = { x, y: stageTop };
  });
  mascotStage.addEventListener("pointerup", (event) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    mascotStage.dataset.dragging = "false";
    mascotStage.releasePointerCapture(event.pointerId);

    if (!hasDragged) {
      startAmbientAnimation(mascot);
      openSettingsBubble();
      return;
    }

    didJustDrag = true;
    startAmbientAnimation(mascot);
    void saveCustomPositionFromDrag(dragPosition.x, dragPosition.y, mascotStage.offsetWidth);
    window.setTimeout(() => {
      didJustDrag = false;
    }, 0);
  });
  mascotStage.addEventListener("click", () => {
    if (isDragging || didJustDrag) {
      return;
    }

    openSettingsBubble();
  });

  let bubble: HTMLDivElement | null = null;
  const shouldShowBubble =
    bubbleMode !== "reminder" ||
    currentState === "alert" ||
    currentState === "stretch" ||
    currentState === "success";

  if (shouldShowBubble) {
    bubble = document.createElement("div");
    bubble.className = "turtle-overlay-bubble";

    if (bubbleMode === "settings") {
      bubble.dataset.mode = "settings";
      bubble.append(createSettingsBubbleContent());
    } else if (bubbleMode === "preferences") {
      bubble.dataset.mode = "settings";
      bubble.append(createPreferencesBubbleContent());
    } else if (currentState === "stretch") {
      bubble.dataset.mode = "stretch";
      bubble.append(createStretchBubbleContent());
    } else if (currentState === "success") {
      bubble.dataset.mode = "stretch";
      bubble.append(createSuccessBubbleContent());
    } else {
      bubble.dataset.mode = "action";
      bubble.append(createReminderBubbleContent());
    }

    overlay.append(bubble);
  }

  mascotStage.append(mascot);
  overlay.append(mascotStage);
  shadowRoot.append(overlay);

  const keepCurrentMascotInsideViewport = () => {
    window.requestAnimationFrame(() => {
      keepMascotInsideViewport(host, overlay, mascot, currentState);
    });
  };
  mascot.addEventListener("load", keepCurrentMascotInsideViewport);

  if (overlaySettings.customPosition) {
    const bubbleHeight = bubble?.offsetHeight ?? 0;
    const stageWidth = mascotStage.offsetWidth;
    const stageHeight = mascotStage.offsetHeight;
    const storedLeft = (overlaySettings.customPosition.xPercent / 100) * window.innerWidth;
    const storedStageTop = (overlaySettings.customPosition.yPercent / 100) * window.innerHeight;
    const stageTop = Math.min(
      Math.max(0, window.innerHeight - stageHeight),
      Math.max(bubbleHeight, storedStageTop)
    );

    if (host.dataset.edgeSnapped === "true") {
      if (host.dataset.position === "bottom-left") {
        host.style.left = "0";
        host.style.right = "auto";
      } else {
        host.style.left = "auto";
        host.style.right = "0";
      }
    } else {
      host.style.left = `${Math.min(Math.max(0, window.innerWidth - stageWidth), Math.max(0, storedLeft))}px`;
      host.style.right = "auto";
    }

    host.style.top = `${stageTop - bubbleHeight}px`;
    host.style.bottom = "auto";
  }

  if (currentState === "hidden") {
    setMascotFrame(mascot, FRAMES.neckIn[0]);
    return;
  }

  startAmbientAnimation(mascot);
  keepCurrentMascotInsideViewport();
}

function showReminder() {
  if (overlayStopped) {
    return;
  }

  overlayState = {
    visibilityState: "alert",
    turtleState: "idle",
    message: getOverlayCopy().reminder
  };
  renderOverlay();
}

function hideOverlay() {
  if (overlayStopped) {
    return;
  }

  clearReactionAnimation();
  clearAmbientAnimation();
  clearStretchTimer();
  clearSuccessTimer();
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

  const header = createSettingsHeader(copy.settingsTitle, copy.closeLabel);

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

  const intervalLabel = document.createElement("span");
  intervalLabel.className = "turtle-overlay-settings-label";
  intervalLabel.textContent = copy.intervalLabel;

  const intervalGroup = document.createElement("div");
  intervalGroup.className = "turtle-overlay-stopwatch";
  const decreaseButton = document.createElement("button");
  decreaseButton.type = "button";
  decreaseButton.className = "turtle-overlay-stepper-button";
  decreaseButton.textContent = "-";
  decreaseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    pendingReminderIntervalMinutes = normalizeReminderIntervalMinutes(
      pendingReminderIntervalMinutes - REMINDER_INTERVAL_STEP_MINUTES
    );
    renderOverlay();
  });
  const intervalValue = document.createElement("span");
  intervalValue.className = "turtle-overlay-stopwatch-value";
  intervalValue.textContent = formatStopwatchSeconds(pendingReminderIntervalMinutes * 60);
  const increaseButton = document.createElement("button");
  increaseButton.type = "button";
  increaseButton.className = "turtle-overlay-stepper-button";
  increaseButton.textContent = "+";
  increaseButton.addEventListener("click", (event) => {
    event.stopPropagation();
    pendingReminderIntervalMinutes = normalizeReminderIntervalMinutes(
      pendingReminderIntervalMinutes + REMINDER_INTERVAL_STEP_MINUTES
    );
    renderOverlay();
  });
  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "turtle-overlay-ok-button";
  confirmButton.textContent = copy.okLabel;
  confirmButton.addEventListener("click", (event) => {
    event.stopPropagation();
    bubbleMode = "reminder";
    overlayState = { ...WAITING_OVERLAY_STATE };
    void updateOverlaySettings({
      ...overlaySettings,
      reminderIntervalMinutes: pendingReminderIntervalMinutes,
      lastReminderShownAt: new Date().toISOString()
    });
  });
  intervalGroup.append(decreaseButton, intervalValue, increaseButton, confirmButton);

  const nextLabel = document.createElement("span");
  nextLabel.className = "turtle-overlay-settings-label";
  nextLabel.textContent = copy.nextLabel;

  const nextCountdown = document.createElement("span");
  nextCountdown.className = "turtle-overlay-next-countdown";
  startSettingsCountdown(nextCountdown);

  const preferencesButton = document.createElement("button");
  preferencesButton.type = "button";
  preferencesButton.className = "turtle-overlay-preferences-button";
  preferencesButton.textContent = copy.preferencesLabel;
  preferencesButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPreferencesBubble();
  });

  settings.append(
    header,
    enabledLabel,
    enabledButton,
    intervalLabel,
    intervalGroup,
    nextLabel,
    nextCountdown,
    preferencesButton
  );

  return settings;
}

function createReminderBubbleContent() {
  const copy = getOverlayCopy();
  const content = document.createElement("div");
  content.className = "turtle-overlay-reminder";

  const message = document.createElement("span");
  message.className = "turtle-overlay-reminder-text";
  message.textContent = overlayState.message || copy.reminder;
  message.addEventListener("click", (event) => {
    event.stopPropagation();
    openSettingsBubble();
  });

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "turtle-overlay-primary-button";
  startButton.textContent = copy.startStretchLabel;
  startButton.addEventListener("click", (event) => {
    event.stopPropagation();
    startStretchRoutine();
  });

  content.append(message, startButton);

  return content;
}

function createStretchBubbleContent() {
  const copy = getOverlayCopy();
  const phaseIndex = getCurrentStretchPhaseIndex();
  const phase = copy.stretchPhases[phaseIndex];
  const content = document.createElement("div");
  content.className = "turtle-overlay-stretch";

  const timerLabel = document.createElement("span");
  timerLabel.className = "turtle-overlay-settings-label";
  timerLabel.textContent = copy.stretchTimerLabel;

  const timerValue = document.createElement("strong");
  timerValue.className = "turtle-overlay-stretch-timer";
  timerValue.textContent = formatStopwatchSeconds(overlayState.remainingSeconds ?? STRETCH_TOTAL_SECONDS);

  const title = document.createElement("strong");
  title.className = "turtle-overlay-stretch-title";
  title.textContent = phase.title;

  const guide = document.createElement("span");
  guide.className = "turtle-overlay-stretch-guide";
  guide.textContent = phase.guide;

  const doneButton = document.createElement("button");
  doneButton.type = "button";
  doneButton.className = "turtle-overlay-primary-button";
  doneButton.disabled = (overlayState.remainingSeconds ?? STRETCH_TOTAL_SECONDS) > 0;
  doneButton.textContent = copy.stretchDoneLabel;
  doneButton.addEventListener("click", (event) => {
    event.stopPropagation();
    completeStretchRoutine();
  });

  content.append(timerLabel, timerValue, title, guide, doneButton);

  return content;
}

function createSuccessBubbleContent() {
  const content = document.createElement("div");
  content.className = "turtle-overlay-reminder";

  const message = document.createElement("span");
  message.className = "turtle-overlay-reminder-text";
  message.textContent = overlayState.message || getOverlayCopy().stretchSuccess;
  content.append(message);

  return content;
}

function createPreferencesBubbleContent() {
  const copy = getOverlayCopy();
  const preferences = document.createElement("div");
  preferences.className = "turtle-overlay-settings turtle-overlay-preferences";

  const header = createSettingsHeader(copy.preferencesLabel, copy.closeLabel);

  const languageLabel = document.createElement("span");
  languageLabel.className = "turtle-overlay-settings-label";
  languageLabel.textContent = copy.languageLabel;

  const languageGroup = document.createElement("div");
  languageGroup.className = "turtle-overlay-flag-segment";
  OVERLAY_LANGUAGE_OPTIONS.forEach((language) => {
    const languageOption = OVERLAY_LANGUAGE_FLAGS[language];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "turtle-overlay-flag-button";
    button.dataset.active = String(overlaySettings.language === language);
    button.textContent = languageOption.flag;
    button.setAttribute("aria-label", languageOption.label);
    button.title = languageOption.label;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      void updateOverlaySettings({
        ...overlaySettings,
        language
      });
    });
    languageGroup.append(button);
  });

  const sizeLabel = document.createElement("span");
  sizeLabel.className = "turtle-overlay-settings-label";
  sizeLabel.textContent = copy.sizeLabel;

  const sizeControl = document.createElement("label");
  sizeControl.className = "turtle-overlay-size-control";
  const sizeInput = document.createElement("input");
  sizeInput.type = "range";
  sizeInput.min = String(MIN_TURTLE_SIZE);
  sizeInput.max = String(MAX_TURTLE_SIZE);
  sizeInput.step = "1";
  sizeInput.value = String(overlaySettings.turtleSize);
  const sizeValue = document.createElement("span");
  sizeValue.className = "turtle-overlay-size-value";
  sizeValue.textContent = String(overlaySettings.turtleSize);
  sizeInput.addEventListener("input", (event) => {
    const nextSize = normalizeTurtleSize(Number((event.currentTarget as HTMLInputElement).value));
    sizeValue.textContent = String(nextSize);
    overlaySettings = {
      ...overlaySettings,
      turtleSize: nextSize
    };
    const currentMascot = document
      .getElementById(OVERLAY_HOST_ID)
      ?.shadowRoot?.querySelector<HTMLImageElement>(".turtle-overlay-mascot");
    if (currentMascot) {
      applyTurtleSizeStyle(currentMascot, nextSize, currentMascot.parentElement ?? undefined);
    }
  });
  sizeInput.addEventListener("change", (event) => {
    const nextSize = normalizeTurtleSize(Number((event.currentTarget as HTMLInputElement).value));
    void updateOverlaySettings({
      ...overlaySettings,
      turtleSize: nextSize
    });
  });
  sizeControl.append(sizeInput, sizeValue);

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "turtle-overlay-preferences-button";
  backButton.textContent = copy.backLabel;
  backButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openSettingsBubble();
  });

  preferences.append(header, languageLabel, languageGroup, sizeLabel, sizeControl, backButton);

  return preferences;
}

function createSettingsHeader(titleText: string, closeLabel: string) {
  const header = document.createElement("div");
  header.className = "turtle-overlay-settings-header";

  const title = document.createElement("strong");
  title.className = "turtle-overlay-settings-title";
  title.textContent = titleText;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "turtle-overlay-close-button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", closeLabel);
  closeButton.title = closeLabel;
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeSettingsBubble();
  });

  header.append(title, closeButton);

  return header;
}

try {
  chrome.runtime.onMessage.addListener((message: BackgroundToOverlayMessage) => {
    if (message.type === "SHOW_STRETCH_REMINDER") {
      showReminder();
    }

    if (message.type === "HIDE_STRETCH_REMINDER") {
      hideOverlay();
    }

    return undefined;
  });
} catch {
  stopOverlayAfterContextInvalidated();
}

void loadOverlaySettings().then(() => {
  if (overlayStopped) {
    return;
  }

  preloadMascotFrames();
  overlayState = { ...WAITING_OVERLAY_STATE };
  renderOverlay();
});
