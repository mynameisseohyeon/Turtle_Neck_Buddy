import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { OnboardingPanel } from "./components/OnboardingPanel";
import type {
  BackgroundToPopupMessage,
  CurrentSiteOverlayPermissionState,
  OverlayLanguage,
  OverlayPosition,
  OverlaySettings,
  PopupToBackgroundMessage
} from "../shared/overlayMessages";
import {
  DEFAULT_OVERLAY_SETTINGS,
  MAX_REMINDER_INTERVAL_MINUTES,
  MIN_REMINDER_INTERVAL_MINUTES,
  OVERLAY_SETTINGS_STORAGE_KEY,
  REMINDER_INTERVAL_STEP_MINUTES,
  normalizeOverlaySettings
} from "../shared/overlaySettings";
import { getOnboardingCompleted, ONBOARDING_COMPLETED_STORAGE_KEY } from "../shared/onboarding";
import {
  addStretchCompletion,
  DEFAULT_STRETCH_RECORDS,
  getCurrentStreak,
  getLocalDateKey,
  getTodayCompletedCount,
  normalizeStretchRecords,
  STRETCH_RECORDS_STORAGE_KEY,
  type StretchRecords
} from "../shared/stretchRecords";

type PanelView = "main" | "record" | "routine" | "timer" | "settings" | "preferences";

const STRETCH_PHASES = [
  { title: "턱 당기기", guide: "시선은 정면에 두고 턱을 천천히 뒤로 당겨요." },
  { title: "목 좌우 기울이기", guide: "어깨를 내리고 목을 좌우로 부드럽게 기울여요." },
  { title: "어깨 뒤로 돌리기", guide: "가슴을 펴고 어깨를 천천히 뒤로 돌려요." }
] as const;
const STRETCH_TOTAL_SECONDS = 30;
const STRETCH_PHASE_SECONDS = 10;

const LANGUAGE_OPTIONS: Array<{ value: OverlayLanguage; label: string; flag: string }> = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "zh", label: "中文", flag: "🇨🇳" },
  { value: "es", label: "Español", flag: "🇪🇸" }
];

const DEFAULT_PERMISSION_STATE: CurrentSiteOverlayPermissionState = {
  isSupported: false,
  origin: null,
  hostname: null,
  granted: false,
  reason: "permission-unavailable"
};

function canUseExtensionApi() {
  return (
    typeof chrome !== "undefined" &&
    Boolean(chrome.runtime?.id) &&
    Boolean(chrome.runtime?.sendMessage) &&
    Boolean(chrome.storage?.local) &&
    Boolean(chrome.permissions)
  );
}

function sendBackgroundMessage(message: PopupToBackgroundMessage) {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundToPopupMessage>;
}

function getNextReminderAt(settings: OverlaySettings, now = new Date()) {
  const storedNextReminderAt = settings.nextReminderAt ? Date.parse(settings.nextReminderAt) : Number.NaN;
  return Number.isFinite(storedNextReminderAt)
    ? new Date(storedNextReminderAt)
    : new Date(now.getTime() + settings.reminderIntervalMinutes * 60_000);
}

function formatRemaining(target: Date, now = new Date()) {
  const remainingSeconds = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getWeekDays(records: StretchRecords) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = getLocalDateKey(date);
    return {
      key,
      label: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date),
      count: records.days.find((record) => record.date === key)?.completedCount ?? 0,
      isToday: index === 6
    };
  });
}

export function App() {
  const [view, setView] = useState<PanelView>("main");
  const [settings, setSettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);
  const [records, setRecords] = useState<StretchRecords>(DEFAULT_STRETCH_RECORDS);
  const [remainingSeconds, setRemainingSeconds] = useState(STRETCH_TOTAL_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [now, setNow] = useState(new Date());
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [permissionState, setPermissionState] = useState(DEFAULT_PERMISSION_STATE);
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "checking" | "requesting">("checking");
  const [feedback, setFeedback] = useState("");

  const todayCount = getTodayCompletedCount(records, now);
  const currentStreak = getCurrentStreak(records, now);
  const nextReminderAt = getNextReminderAt(settings, now);
  const currentPhaseIndex = Math.min(
    STRETCH_PHASES.length - 1,
    Math.floor((STRETCH_TOTAL_SECONDS - remainingSeconds) / STRETCH_PHASE_SECONDS)
  );
  const currentPhase = STRETCH_PHASES[currentPhaseIndex];
  const timerProgress = ((STRETCH_TOTAL_SECONDS - remainingSeconds) / STRETCH_TOTAL_SECONDS) * 360;
  const weekDays = useMemo(() => getWeekDays(records), [records, now]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (view !== "timer" || isPaused || remainingSeconds <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [view, isPaused, remainingSeconds]);

  useEffect(() => {
    if (view === "timer" && remainingSeconds === 0) {
      void completeRoutine();
    }
  }, [remainingSeconds, view]);

  useEffect(() => {
    if (!canUseExtensionApi()) {
      setIsOnboardingOpen(false);
      setIsOnboardingLoading(false);
      setPermissionStatus("idle");
      return;
    }

    void Promise.all([
      chrome.storage.local.get([
        ONBOARDING_COMPLETED_STORAGE_KEY,
        OVERLAY_SETTINGS_STORAGE_KEY,
        STRETCH_RECORDS_STORAGE_KEY
      ]),
      sendBackgroundMessage({ type: "GET_CURRENT_SITE_OVERLAY_PERMISSION" })
    ])
      .then(([stored, permissionResponse]) => {
        const storedSettings = normalizeOverlaySettings(stored[OVERLAY_SETTINGS_STORAGE_KEY]);
        setSettings(storedSettings);
        setDraftSettings(storedSettings);
        setRecords(normalizeStretchRecords(stored[STRETCH_RECORDS_STORAGE_KEY]));
        setIsOnboardingOpen(!getOnboardingCompleted(stored[ONBOARDING_COMPLETED_STORAGE_KEY]));
        if (permissionResponse.type === "CURRENT_SITE_OVERLAY_PERMISSION") {
          setPermissionState(permissionResponse.payload);
        }
      })
      .catch(() => setFeedback("설정을 불러오지 못했어요."))
      .finally(() => {
        setPermissionStatus("idle");
        setIsOnboardingLoading(false);
      });
  }, []);

  async function persistSettings(nextSettings: OverlaySettings) {
    setSettings(nextSettings);
    setDraftSettings(nextSettings);
    if (!canUseExtensionApi()) {
      return;
    }

    await chrome.storage.local.set({ [OVERLAY_SETTINGS_STORAGE_KEY]: nextSettings });
    await sendBackgroundMessage({ type: "RESCHEDULE_STRETCH_REMINDER" });
  }

  async function toggleReminder() {
    const nextSettings = { ...settings, overlayEnabled: !settings.overlayEnabled };
    if (nextSettings.overlayEnabled && !nextSettings.nextReminderAt) {
      nextSettings.nextReminderAt = new Date(Date.now() + nextSettings.reminderIntervalMinutes * 60_000).toISOString();
    }
    await persistSettings(nextSettings);
  }

  async function saveSettings() {
    const nextSettings = {
      ...draftSettings,
      lastReminderShownAt: new Date().toISOString(),
      nextReminderAt: new Date(Date.now() + draftSettings.reminderIntervalMinutes * 60_000).toISOString()
    };
    await persistSettings(nextSettings);
    setFeedback("설정을 저장했어요.");
    setView("main");
  }

  async function snoozeReminder() {
    const nextReminderAt = new Date(Date.now() + 5 * 60_000).toISOString();
    await persistSettings({ ...settings, nextReminderAt });
    if (canUseExtensionApi()) {
      await sendBackgroundMessage({ type: "SNOOZE_STRETCH_REMINDER", payload: { snoozeMinutes: 5 } });
    }
    setFeedback("5분 뒤에 다시 알려드릴게요.");
  }

  function openRoutine() {
    setRemainingSeconds(STRETCH_TOTAL_SECONDS);
    setIsPaused(false);
    setView("routine");
  }

  function startRoutine() {
    setRemainingSeconds(STRETCH_TOTAL_SECONDS);
    setIsPaused(false);
    setView("timer");
  }

  async function completeRoutine() {
    const nextRecords = addStretchCompletion(records);
    setRecords(nextRecords);
    setRemainingSeconds(STRETCH_TOTAL_SECONDS);
    setIsPaused(false);
    setFeedback("30초 루틴을 완료했어요!");
    setView("main");
    if (canUseExtensionApi()) {
      await chrome.storage.local.set({ [STRETCH_RECORDS_STORAGE_KEY]: nextRecords });
    }
  }

  async function requestSitePermission() {
    if (!permissionState.origin || !canUseExtensionApi()) {
      return;
    }
    setPermissionStatus("requesting");
    const granted = await chrome.permissions.request({ origins: [permissionState.origin] });
    setPermissionState((current) => ({ ...current, granted }));
    setPermissionStatus("idle");
  }

  async function completeOnboarding() {
    if (canUseExtensionApi()) {
      await chrome.storage.local.set({ [ONBOARDING_COMPLETED_STORAGE_KEY]: true });
    }
    setIsOnboardingOpen(false);
  }

  if (isOnboardingLoading) {
    return <main className="detail-panel-shell loading-panel" aria-label="설정 불러오는 중" />;
  }

  if (isOnboardingOpen) {
    return (
      <OnboardingPanel
        reminderIntervalMinutes={settings.reminderIntervalMinutes}
        permissionState={permissionState}
        permissionStatus={permissionStatus === "requesting" ? "requesting" : "idle"}
        feedback={feedback}
        onSaveInterval={async (interval) => {
          await persistSettings({
            ...settings,
            reminderIntervalMinutes: interval,
            nextReminderAt: new Date(Date.now() + interval * 60_000).toISOString()
          });
        }}
        onEnableSite={requestSitePermission}
        onPreview={async () => undefined}
        onComplete={completeOnboarding}
      />
    );
  }

  return (
    <main className="detail-panel-shell">
      <header className="detail-header">
        <button
          type="button"
          className="brand-button"
          onClick={() => setView("main")}
          aria-label="메인 화면"
        >
          <span className="brand-mark" aria-hidden="true" />
          <span>Turtle Neck Buddy</span>
        </button>
        {view === "main" ? (
          <button type="button" className="icon-button" onClick={() => setView("settings")} aria-label="설정">
            ⚙
          </button>
        ) : (
          <button type="button" className="back-button" onClick={() => setView("main")}>
            ← 뒤로
          </button>
        )}
      </header>

      {view === "main" ? (
        <section className="panel-view main-reminder-view" aria-labelledby="main-title">
          <div className="main-title-row">
            <div>
              <p className="eyebrow">오늘도 목을 가볍게</p>
              <h1 id="main-title">스트레칭 리마인더</h1>
            </div>
            <button
              type="button"
              className="switch-control"
              data-active={settings.overlayEnabled}
              onClick={() => void toggleReminder()}
              aria-pressed={settings.overlayEnabled}
            >
              <span>{settings.overlayEnabled ? "ON" : "OFF"}</span>
            </button>
          </div>

          <div className="mascot-reserved-space" aria-label="거북이 이미지가 들어갈 자리" />

          <article className="reminder-card">
            <div>
              <span className="card-label">다음 알림</span>
              <strong>{settings.overlayEnabled ? formatRemaining(nextReminderAt, now) : "알림 꺼짐"}</strong>
              <small>{nextReminderAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</small>
            </div>
            <span className="interval-badge">{settings.reminderIntervalMinutes}분 간격</span>
          </article>

          <div className="primary-actions">
            <button type="button" className="primary-button" onClick={openRoutine}>지금 스트레칭</button>
            <button type="button" className="secondary-button" onClick={() => void snoozeReminder()}>5분 뒤 알림</button>
          </div>

          <article className="today-summary">
            <div>
              <span className="card-label">오늘의 스트레칭</span>
              <strong>{todayCount}<small> / {records.dailyGoal}회</small></strong>
            </div>
            <div className="summary-progress" aria-label={`오늘 목표 ${records.dailyGoal}회 중 ${todayCount}회 완료`}>
              <span style={{ width: `${Math.min(100, (todayCount / records.dailyGoal) * 100)}%` }} />
            </div>
            <button type="button" className="text-button" onClick={() => setView("record")}>기록 보기 →</button>
          </article>

          {feedback ? <p className="panel-feedback" role="status">{feedback}</p> : null}
        </section>
      ) : null}

      {view === "record" ? (
        <section className="panel-view" aria-labelledby="record-title">
          <p className="eyebrow">꾸준함이 만든 변화</p>
          <h1 id="record-title">오늘의 기록</h1>
          <div className="record-metrics">
            <article><span>오늘 완료</span><strong>{todayCount}회</strong></article>
            <article><span>목표 횟수</span><strong>{records.dailyGoal}회</strong></article>
            <article><span>연속 실천</span><strong>{currentStreak}일</strong></article>
          </div>
          <article className="week-card">
            <h2>최근 7일</h2>
            <ul className="week-list">
              {weekDays.map((day) => (
                <li key={day.key} data-today={day.isToday}>
                  <span>{day.label}</span>
                  <strong>{day.count}</strong>
                  <small>회</small>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {view === "routine" ? (
        <section className="panel-view routine-view" aria-labelledby="routine-title">
          <p className="eyebrow">오늘의 루틴</p>
          <h1 id="routine-title">목과 어깨를 천천히 풀어요</h1>
          <div className="mascot-reserved-space routine-space" aria-label="거북이 스트레칭 이미지가 들어갈 자리" />
          <article className="routine-card">
            <div className="step-indicator"><span>진행 단계</span><strong>1 / 3</strong></div>
            <h2>{STRETCH_PHASES[0].title}</h2>
            <p>{STRETCH_PHASES.map((phase) => phase.title).join(" · ")}</p>
            <span className="duration-chip">예상 시간 30초</span>
          </article>
          <div className="primary-actions">
            <button type="button" className="primary-button" onClick={startRoutine}>30초 시작</button>
            <button type="button" className="secondary-button" onClick={() => setView("main")}>나중에 하기</button>
          </div>
        </section>
      ) : null}

      {view === "timer" ? (
        <section className="panel-view timer-view" aria-labelledby="timer-title">
          <div className="step-indicator"><span>진행 단계</span><strong>{currentPhaseIndex + 1} / 3</strong></div>
          <h1 id="timer-title">{currentPhase.title}</h1>
          <div className="mascot-reserved-space timer-space" aria-label="거북이 스트레칭 포즈가 들어갈 자리" />
          <div className="circular-timer" style={{ "--timer-progress": `${timerProgress}deg` } as CSSProperties}>
            <div><strong>{remainingSeconds}</strong><span>초</span></div>
          </div>
          <p className="timer-guide">{currentPhase.guide}</p>
          <div className="primary-actions">
            <button type="button" className="secondary-button" onClick={() => setIsPaused((current) => !current)}>
              {isPaused ? "계속하기" : "일시정지"}
            </button>
            <button type="button" className="primary-button" onClick={() => void completeRoutine()}>완료하기</button>
          </div>
        </section>
      ) : null}

      {view === "settings" ? (
        <section className="panel-view" aria-labelledby="settings-title">
          <p className="eyebrow">Reminder</p>
          <h1 id="settings-title">스트레칭 설정</h1>
          <div className="form-stack">
            <label className="form-row toggle-row">
              <span><strong>알림</strong><small>설정한 시간이 되면 거북이가 나타나요.</small></span>
              <input
                type="checkbox"
                checked={draftSettings.overlayEnabled}
                onChange={(event) => setDraftSettings({ ...draftSettings, overlayEnabled: event.target.checked })}
              />
            </label>
            <div className="form-row">
              <span><strong>알림 간격</strong><small>10분 단위로 조절할 수 있어요.</small></span>
              <div className="stepper-control">
                <button type="button" aria-label="10분 줄이기" onClick={() => setDraftSettings({
                  ...draftSettings,
                  reminderIntervalMinutes: Math.max(MIN_REMINDER_INTERVAL_MINUTES, draftSettings.reminderIntervalMinutes - REMINDER_INTERVAL_STEP_MINUTES)
                })}>−</button>
                <strong>{draftSettings.reminderIntervalMinutes}분</strong>
                <button type="button" aria-label="10분 늘리기" onClick={() => setDraftSettings({
                  ...draftSettings,
                  reminderIntervalMinutes: Math.min(MAX_REMINDER_INTERVAL_MINUTES, draftSettings.reminderIntervalMinutes + REMINDER_INTERVAL_STEP_MINUTES)
                })}>＋</button>
              </div>
            </div>
            <div className="form-row next-reminder-row">
              <span><strong>다음 알림 시간</strong><small>저장한 시점부터 새 간격을 적용해요.</small></span>
              <time>{getNextReminderAt(draftSettings, now).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</time>
            </div>
            <div className="form-row time-range-row">
              <span><strong>방해 금지 시간</strong><small>이 시간에는 자동으로 나타나지 않아요.</small></span>
              <div>
                <input type="time" value={draftSettings.doNotDisturbStart} onChange={(event) => setDraftSettings({ ...draftSettings, doNotDisturbStart: event.target.value })} />
                <span>—</span>
                <input type="time" value={draftSettings.doNotDisturbEnd} onChange={(event) => setDraftSettings({ ...draftSettings, doNotDisturbEnd: event.target.value })} />
              </div>
            </div>
          </div>
          <button type="button" className="preferences-link" onClick={() => setView("preferences")}>거북이 환경 설정 →</button>
          <button type="button" className="primary-button full-button" onClick={() => void saveSettings()}>저장</button>
        </section>
      ) : null}

      {view === "preferences" ? (
        <section className="panel-view" aria-labelledby="preferences-title">
          <p className="eyebrow">Preferences</p>
          <h1 id="preferences-title">거북이 환경 설정</h1>
          <div className="form-stack">
            <label className="form-row select-row">
              <span><strong>언어</strong><small>말풍선에 사용할 언어예요.</small></span>
              <select value={draftSettings.language} onChange={(event) => setDraftSettings({ ...draftSettings, language: event.target.value as OverlayLanguage })}>
                {LANGUAGE_OPTIONS.map((language) => <option key={language.value} value={language.value}>{language.flag} {language.label}</option>)}
              </select>
            </label>
            <label className="form-row slider-row">
              <span><strong>거북이 크기</strong><small>{draftSettings.turtleSize}</small></span>
              <input type="range" min="20" max="80" value={draftSettings.turtleSize} onChange={(event) => setDraftSettings({ ...draftSettings, turtleSize: Number(event.target.value) })} />
            </label>
            <div className="form-row position-row">
              <span><strong>기본 위치</strong><small>알림이 나타날 화면 가장자리예요.</small></span>
              <div className="segmented-control">
                {(["bottom-left", "bottom-right"] as OverlayPosition[]).map((position) => (
                  <button key={position} type="button" data-active={draftSettings.overlayPosition === position} onClick={() => setDraftSettings({ ...draftSettings, overlayPosition: position, customPosition: { xPercent: position === "bottom-left" ? 0 : 100, yPercent: 18 } })}>
                    {position === "bottom-left" ? "왼쪽" : "오른쪽"}
                  </button>
                ))}
              </div>
            </div>
            <label className="form-row toggle-row">
              <span><strong>조용한 모드</strong><small>소리 없이 작은 말풍선만 표시해요.</small></span>
              <input type="checkbox" checked={draftSettings.quietMode} onChange={(event) => setDraftSettings({ ...draftSettings, quietMode: event.target.checked })} />
            </label>
          </div>
          <div className="primary-actions preferences-actions">
            <button type="button" className="secondary-button" onClick={() => setView("settings")}>뒤로</button>
            <button type="button" className="primary-button" onClick={() => void saveSettings()}>저장</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
