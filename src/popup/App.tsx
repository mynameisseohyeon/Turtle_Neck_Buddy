import { useEffect, useMemo, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { StretchCard } from "./components/StretchCard";
import { TurtleSprite } from "./components/TurtleSprite";
import { PRAISE_MESSAGES, TURTLE_MESSAGES } from "../shared/messages";
import type {
  BackgroundToPopupMessage,
  CurrentSiteOverlayPermissionState,
  PopupToBackgroundMessage
} from "../shared/overlayMessages";
import { STRETCH_CARDS } from "../shared/stretchCards";
import type { TurtleState } from "../shared/types";

const STATE_OPTIONS: Array<{ label: string; value: TurtleState }> = [
  { label: "기본", value: "idle" },
  { label: "알림", value: "alert" },
  { label: "진행", value: "stretch" },
  { label: "완료", value: "success" }
];

const DEFAULT_PERMISSION_STATE: CurrentSiteOverlayPermissionState = {
  isSupported: false,
  origin: null,
  hostname: null,
  granted: false,
  reason: "permission-unavailable"
};

function canUseExtensionApi() {
  return typeof chrome !== "undefined" && Boolean(chrome.runtime?.sendMessage);
}

function sendBackgroundMessage(message: PopupToBackgroundMessage) {
  return chrome.runtime.sendMessage(message) as Promise<BackgroundToPopupMessage>;
}

export function App() {
  const [turtleState, setTurtleState] = useState<TurtleState>("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [permissionState, setPermissionState] =
    useState<CurrentSiteOverlayPermissionState>(DEFAULT_PERMISSION_STATE);
  const [permissionStatus, setPermissionStatus] = useState<"idle" | "checking" | "requesting" | "previewing">(
    "checking"
  );
  const [overlayFeedback, setOverlayFeedback] = useState("");
  const currentStretchCard = STRETCH_CARDS[0];

  const speechMessage = useMemo(() => {
    if (turtleState === "success") {
      return PRAISE_MESSAGES[0];
    }

    return TURTLE_MESSAGES[turtleState];
  }, [turtleState]);

  const refreshPermissionState = async () => {
    if (!canUseExtensionApi()) {
      setPermissionState(DEFAULT_PERMISSION_STATE);
      setPermissionStatus("idle");
      setOverlayFeedback("Chrome 확장으로 로드하면 현재 사이트 오버레이를 켤 수 있어요.");
      return;
    }

    setPermissionStatus("checking");

    try {
      const response = await sendBackgroundMessage({ type: "GET_CURRENT_SITE_OVERLAY_PERMISSION" });

      if (response.type === "CURRENT_SITE_OVERLAY_PERMISSION") {
        setPermissionState(response.payload);
        setOverlayFeedback("");
      }
    } catch {
      setPermissionState(DEFAULT_PERMISSION_STATE);
      setOverlayFeedback("현재 사이트 권한 상태를 확인하지 못했어요.");
    } finally {
      setPermissionStatus("idle");
    }
  };

  useEffect(() => {
    void refreshPermissionState();
  }, []);

  const handleRequestOverlayPermission = async () => {
    if (!permissionState.origin || !canUseExtensionApi()) {
      return;
    }

    setPermissionStatus("requesting");
    setOverlayFeedback("");

    void chrome.permissions
      .request({ origins: [permissionState.origin] })
      .then((granted) => {
      setOverlayFeedback(granted ? "현재 사이트에서 거북이 오버레이를 사용할 수 있어요." : "권한 요청이 취소됐어요.");
      void refreshPermissionState();
      })
      .catch(() => {
        setOverlayFeedback("권한 요청을 완료하지 못했어요.");
        setPermissionStatus("idle");
      });
  };

  const handlePreviewOverlay = async () => {
    if (!canUseExtensionApi()) {
      return;
    }

    setPermissionStatus("previewing");
    setOverlayFeedback("");

    try {
      const response = await sendBackgroundMessage({ type: "PREVIEW_OVERLAY_ON_CURRENT_TAB" });

      if (response.type === "OVERLAY_PREVIEW_RESULT" && response.payload.ok) {
        setOverlayFeedback("현재 탭에 거북이 오버레이를 띄웠어요.");
      } else {
        setOverlayFeedback("현재 탭에 오버레이를 띄우지 못했어요.");
      }
    } catch {
      setOverlayFeedback("오버레이 미리보기를 실행하지 못했어요.");
    } finally {
      setPermissionStatus("idle");
    }
  };

  const permissionDescription = useMemo(() => {
    if (!permissionState.isSupported) {
      return "http 또는 https 페이지에서 사용할 수 있어요.";
    }

    if (permissionState.granted) {
      return `${permissionState.hostname}에서 오버레이 사용 가능`;
    }

    return `${permissionState.hostname}에서 거북이 오버레이를 켜려면 권한이 필요해요.`;
  }, [permissionState]);

  const isPermissionBusy = permissionStatus === "checking" || permissionStatus === "requesting";

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div>
          <p className="section-label">Turtle Neck Buddy</p>
          <h1>목 쉬는 시간</h1>
        </div>
        <button
          type="button"
          className="settings-button"
          aria-expanded={isSettingsOpen}
          aria-controls="settings-panel"
          onClick={() => setIsSettingsOpen((current) => !current)}
        >
          설정
        </button>
      </header>

      <section className="status-strip" aria-label="오늘 상태">
        <div>
          <span>오늘 완료</span>
          <strong>0회</strong>
        </div>
        <div>
          <span>다음 알림</span>
          <strong>50분</strong>
        </div>
      </section>

      <section className="site-permission-panel" aria-label="현재 사이트 오버레이 권한">
        <div>
          <span>현재 사이트</span>
          <strong>{permissionState.hostname ?? "확인 필요"}</strong>
          <p>{permissionDescription}</p>
        </div>
        {permissionState.granted ? (
          <button
            type="button"
            className="ghost-button"
            disabled={permissionStatus === "previewing"}
            onClick={handlePreviewOverlay}
          >
            {permissionStatus === "previewing" ? "확인 중" : "오버레이 보기"}
          </button>
        ) : (
          <button
            type="button"
            className="ghost-button"
            disabled={!permissionState.origin || isPermissionBusy}
            onClick={handleRequestOverlayPermission}
          >
            {isPermissionBusy ? "확인 중" : "현재 사이트 켜기"}
          </button>
        )}
        {overlayFeedback ? <p className="permission-feedback">{overlayFeedback}</p> : null}
      </section>

      <section className="mascot-panel">
        <TurtleSprite state={turtleState} />
        <p className="speech-bubble">{speechMessage}</p>
      </section>

      <StretchCard card={currentStretchCard} />

      <section className="state-switcher" aria-label="화면 상태 미리보기">
        {STATE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === turtleState ? "state-button is-active" : "state-button"}
            onClick={() => setTurtleState(option.value)}
          >
            {option.label}
          </button>
        ))}
      </section>

      <div className="action-row">
        <button type="button" className="primary-button" onClick={() => setTurtleState("stretch")}>
          30초 시작
        </button>
        <button type="button" className="secondary-button" onClick={() => setTurtleState("idle")}>
          나중에
        </button>
      </div>

      {isSettingsOpen ? (
        <div id="settings-panel">
          <SettingsPanel />
        </div>
      ) : null}
    </main>
  );
}
