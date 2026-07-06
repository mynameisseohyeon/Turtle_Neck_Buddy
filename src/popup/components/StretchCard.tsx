import type { StretchCard as StretchCardType } from "../../shared/types";

type StretchCardProps = {
  card: StretchCardType;
};

export function StretchCard({ card }: StretchCardProps) {
  return (
    <section className="stretch-card" aria-labelledby="stretch-card-title">
      <div className="stretch-card-copy">
        <p className="section-label">Today's stretch</p>
        <h2 id="stretch-card-title">{card.title}</h2>
        <p>{card.description}</p>
      </div>
      <div className="timer-ring" aria-label={`${card.durationSeconds}초 타이머`}>
        <span>{card.durationSeconds}</span>
        <small>sec</small>
      </div>
    </section>
  );
}
