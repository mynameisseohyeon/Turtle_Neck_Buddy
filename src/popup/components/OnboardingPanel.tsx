import { useEffect, useState } from "react";
import type { CurrentSiteOverlayPermissionState } from "../../shared/overlayMessages";
import { TurtleSprite } from "./TurtleSprite";

const INTERVAL_OPTIONS = [20, 30, 50] as const;

type OnboardingPanelProps = {
  reminderIntervalMinutes: number;
  permissionState: CurrentSiteOverlayPermissionState;
  permissionStatus: "idle" | "checking" | "requesting" | "previewing";
  feedback: string;
  onSaveInterval: (intervalMinutes: number) => Promise<void>;
  onEnableSite: () => Promise<void>;
  onPreview: () => Promise<void>;
  onComplete: () => Promise<void>;
};

export function OnboardingPanel({
  reminderIntervalMinutes,
  permissionState,
  permissionStatus,
  feedback,
  onSaveInterval,
  onEnableSite,
  onPreview,
  onComplete
}: OnboardingPanelProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 1 && permissionState.granted) {
      setStep(2);
    }
  }, [permissionState.granted, step]);

  const isBusy = permissionStatus !== "idle";

  return (
    <main className="popup-shell onboarding-shell">
      <header className="onboarding-header">
        <p className="section-label">Turtle Neck Buddy</p>
        <span>{step + 1} / 3</span>
      </header>

      <div className="onboarding-progress" aria-label={`설정 ${step + 1}단계`}>
        {[0, 1, 2].map((index) => (
          <span key={index} className={index <= step ? "is-active" : ""} />
        ))}
      </div>

      {step === 0 ? (
        <section className="onboarding-step">
          <div className="onboarding-mascot">
            <TurtleSprite state="idle" />
          </div>
          <p className="onboarding-kicker">반가워요</p>
          <h1>목이 굳기 전에<br />조용히 알려드릴게요</h1>
          <p className="onboarding-copy">집중 흐름을 깨지 않도록 화면 가장자리에서 살짝 나타나요.</p>

          <fieldset className="interval-options">
            <legend>알림 주기</legend>
            {INTERVAL_OPTIONS.map((interval) => (
              <button
                key={interval}
                type="button"
                className={interval === reminderIntervalMinutes ? "interval-option is-active" : "interval-option"}
                onClick={() => void onSaveInterval(interval)}
              >
                <strong>{interval}분</strong>
                <span>{interval === 30 ? "추천" : interval < 30 ? "자주" : "여유"}</span>
              </button>
            ))}
          </fieldset>

          <button type="button" className="primary-button onboarding-primary" onClick={() => setStep(1)}>
            이 주기로 시작
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="onboarding-step">
          <p className="onboarding-kicker">현재 사이트 연결</p>
          <h1>거북이가 머물<br />공간을 열어주세요</h1>
          <p className="onboarding-copy">
            방문 기록은 수집하지 않아요. 선택한 사이트에 거북이를 표시할 때만 권한을 사용합니다.
          </p>

          <div className="onboarding-site-status">
            <span>현재 사이트</span>
            <strong>{permissionState.hostname ?? "일반 웹페이지에서 설정 가능"}</strong>
            <small>{permissionState.granted ? "연결됨" : "연결 대기"}</small>
          </div>

          <button
            type="button"
            className="primary-button onboarding-primary"
            disabled={!permissionState.origin || isBusy}
            onClick={() => void onEnableSite()}
          >
            {permissionStatus === "requesting" || permissionStatus === "checking" ? "연결 중" : "현재 사이트 연결"}
          </button>
          {!permissionState.isSupported ? (
            <button type="button" className="onboarding-text-button" onClick={() => setStep(2)}>
              나중에 연결하기
            </button>
          ) : null}
          {feedback ? <p className="onboarding-feedback">{feedback}</p> : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="onboarding-step onboarding-finish">
          <div className="onboarding-mascot">
            <TurtleSprite state="success" />
          </div>
          <p className="onboarding-kicker">준비 완료</p>
          <h1>이제 {reminderIntervalMinutes}분 뒤에<br />다시 만나요</h1>
          <p className="onboarding-copy">거북이는 사라지지 않고 화면 가장자리에서 조용히 기다립니다.</p>

          {permissionState.granted ? (
            <button
              type="button"
              className="secondary-button onboarding-preview"
              disabled={permissionStatus === "previewing"}
              onClick={() => void onPreview()}
            >
              {permissionStatus === "previewing" ? "부르는 중" : "거북이 지금 만나보기"}
            </button>
          ) : null}
          <button type="button" className="primary-button onboarding-primary" onClick={() => void onComplete()}>
            시작하기
          </button>
          {feedback ? <p className="onboarding-feedback">{feedback}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
