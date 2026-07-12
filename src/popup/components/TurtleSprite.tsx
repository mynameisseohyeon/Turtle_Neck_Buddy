import { useEffect, useState } from "react";
import type { TurtleState } from "../../shared/types";

const framesByState: Record<TurtleState, string[]> = {
  idle: [
    "/assets/turtle/frames/quiet/quiet_01.png",
    "/assets/turtle/frames/quiet/quiet_02.png",
    "/assets/turtle/frames/quiet/quiet_03.png",
    "/assets/turtle/frames/quiet/quiet_04.png"
  ],
  alert: [
    "/assets/turtle/frames/quiet/quiet_01.png",
    "/assets/turtle/frames/quiet/quiet_02.png",
    "/assets/turtle/frames/quiet/quiet_03.png",
    "/assets/turtle/frames/quiet/quiet_04.png"
  ],
  stretch: [
    "/assets/turtle/frames/stretch/stretch_01.png",
    "/assets/turtle/frames/stretch/stretch_02.png",
    "/assets/turtle/frames/stretch/stretch_03.png",
    "/assets/turtle/frames/stretch/stretch_04.png",
    "/assets/turtle/frames/stretch/stretch_05.png"
  ],
  success: [
    "/assets/turtle/frames/success/success_01.png",
    "/assets/turtle/frames/success/success_02.png",
    "/assets/turtle/frames/success/success_03.png",
    "/assets/turtle/frames/success/success_04.png"
  ]
};

const frameSpeedByState: Record<TurtleState, number> = {
  idle: 280,
  alert: 230,
  stretch: 360,
  success: 230
};

type TurtleSpriteProps = {
  state: TurtleState;
};

export function TurtleSprite({ state }: TurtleSpriteProps) {
  const frames = framesByState[state];
  const [frameIndex, setFrameIndex] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setFrameIndex(0);
    setHasImageError(false);

    const frameTimer = window.setInterval(() => {
      setFrameIndex((currentIndex) => (currentIndex + 1) % frames.length);
    }, frameSpeedByState[state]);

    return () => window.clearInterval(frameTimer);
  }, [frames.length, state]);

  return (
    <div className={`turtle-motion turtle-motion-${state}`} aria-label="Turtle Neck Buddy mascot">
      {hasImageError ? (
        <div className="turtle-fallback" aria-hidden="true">
          TNB
        </div>
      ) : (
        <img
          src={frames[frameIndex]}
          alt=""
          className="turtle-sprite"
          draggable={false}
          onError={() => setHasImageError(true)}
        />
      )}
    </div>
  );
}
