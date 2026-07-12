import { useState } from "react";
import { BellRing, ChartNoAxesColumnIncreasing, Clock3, MousePointerClick, TimerReset } from "lucide-react";

const INTERVAL_OPTIONS = [10, 20, 30, 40, 50, 60] as const;
const DETAIL_ASSET_ROOT = "assets/turtle/frames/detail_panel_screen";

type OnboardingPanelProps = {
  reminderIntervalMinutes: number;
  onComplete: (intervalMinutes: number) => Promise<void>;
};

export function OnboardingPanel({ reminderIntervalMinutes, onComplete }: OnboardingPanelProps) {
  const [step, setStep] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(reminderIntervalMinutes);

  return (
    <main className="onboarding-shell">
      <header className="onboarding-header">
        <div className="onboarding-brand">
          <img src={`${DETAIL_ASSET_ROOT}/avatar_head.png`} alt="" />
          <strong>Turtle Neck Buddy</strong>
        </div>
        <span>{step + 1} / 4</span>
      </header>

      <div className="onboarding-progress" aria-label={`사용 안내 ${step + 1}단계`}>
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={index <= step ? "is-active" : ""} />
        ))}
      </div>

      {step === 0 ? (
        <section className="onboarding-step onboarding-welcome">
          <img className="onboarding-turtle" src={`${DETAIL_ASSET_ROOT}/reminder_peek.png`} alt="화면을 기웃거리는 거북이" />
          <div className="onboarding-icon-cue"><MousePointerClick size={22} /><span>확장 프로그램 아이콘</span></div>
          <p className="onboarding-kicker">잘 찾아왔어요!</p>
          <h1>이 아이콘을 누르면<br />언제든 저를 만날 수 있어요</h1>
          <p className="onboarding-copy">평소에는 화면에서 쉬고 있다가, 설정한 시간이 되면 가장자리에서 살짝 나타날게요.</p>
          <button type="button" className="primary-button onboarding-primary" onClick={() => setStep(1)}>기능 알아보기</button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="onboarding-step onboarding-features">
          <p className="onboarding-kicker">이렇게 도와드려요</p>
          <h1>집중은 지키고<br />목은 가볍게</h1>
          <div className="feature-list">
            <article><BellRing size={22} /><div><strong>기웃 스트레칭 알림</strong><span>시간이 되기 전에는 화면에 나타나지 않아요.</span></div></article>
            <article><TimerReset size={22} /><div><strong>30초 동작 가이드</strong><span>턱, 목, 어깨 동작을 거북이가 순서대로 보여줘요.</span></div></article>
            <article><Clock3 size={22} /><div><strong>5분 뒤 다시 알림</strong><span>바쁜 순간에는 잠깐 미루고 다시 만날 수 있어요.</span></div></article>
            <article><ChartNoAxesColumnIncreasing size={22} /><div><strong>오늘과 주간 기록</strong><span>완료 횟수와 꾸준히 실천한 날을 확인해요.</span></div></article>
          </div>
          <button type="button" className="primary-button onboarding-primary" onClick={() => setStep(2)}>알림 시간 정하기</button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="onboarding-step onboarding-interval-step">
          <img className="onboarding-turtle small" src={`${DETAIL_ASSET_ROOT}/ready_pose.png`} alt="기다리는 거북이" />
          <p className="onboarding-kicker">그럼 언제 만날까요?</p>
          <h1>몇 분 뒤를<br />스트레칭 시간으로 할까요?</h1>
          <div className="onboarding-interval-grid" role="group" aria-label="스트레칭 알림 간격">
            {INTERVAL_OPTIONS.map((interval) => (
              <button
                key={interval}
                type="button"
                data-active={selectedInterval === interval}
                onClick={() => setSelectedInterval(interval)}
              >
                <strong>{interval}분</strong>
                {interval === 30 ? <span>추천</span> : null}
              </button>
            ))}
          </div>
          <button type="button" className="primary-button onboarding-primary" onClick={() => setStep(3)}>이 시간으로 정할게요</button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="onboarding-step onboarding-finish">
          <p className="onboarding-kicker">준비 완료</p>
          <h1>좋아요!<br />{selectedInterval}분 뒤에 다시 봐요</h1>
          <p className="onboarding-copy">그동안에는 화면에 나타나지 않고 조용히 기다릴게요.</p>
          <button type="button" className="primary-button onboarding-primary" onClick={() => void onComplete(selectedInterval)}>그럼 이따 봐!</button>
        </section>
      ) : null}
    </main>
  );
}
