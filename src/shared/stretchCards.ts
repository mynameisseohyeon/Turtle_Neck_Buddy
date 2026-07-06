import type { StretchCard } from "./types";

export const STRETCH_CARDS: StretchCard[] = [
  {
    id: "chin_tuck",
    title: "턱 당기기",
    description: "턱을 살짝 뒤로 당기고 목을 길게 유지합니다.",
    durationSeconds: 30,
    guideText: "시선은 정면, 턱은 살짝 뒤로 당겨요."
  },
  {
    id: "neck_tilt",
    title: "목 좌우 기울이기",
    description: "왼쪽 15초, 오른쪽 15초 천천히 기울입니다.",
    durationSeconds: 30,
    guideText: "어깨는 편하게 내리고 목만 천천히 움직여요."
  },
  {
    id: "shoulder_roll",
    title: "어깨 뒤로 돌리기",
    description: "어깨를 뒤로 천천히 돌리고 가슴을 펴줍니다.",
    durationSeconds: 30,
    guideText: "등을 세우고 어깨를 뒤로 부드럽게 돌려요."
  }
];
