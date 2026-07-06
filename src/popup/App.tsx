import { useMemo, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { StretchCard } from "./components/StretchCard";
import { TurtleSprite } from "./components/TurtleSprite";
import { PRAISE_MESSAGES, TURTLE_MESSAGES } from "../shared/messages";
import { STRETCH_CARDS } from "../shared/stretchCards";
import type { TurtleState } from "../shared/types";

const STATE_OPTIONS: Array<{ label: string; value: TurtleState }> = [
  { label: "기본", value: "idle" },
  { label: "알림", value: "alert" },
  { label: "진행", value: "stretch" },
  { label: "완료", value: "success" }
];

export function App() {
  const [turtleState, setTurtleState] = useState<TurtleState>("idle");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const currentStretchCard = STRETCH_CARDS[0];

  const speechMessage = useMemo(() => {
    if (turtleState === "success") {
      return PRAISE_MESSAGES[0];
    }

    return TURTLE_MESSAGES[turtleState];
  }, [turtleState]);

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
