import type { TurtleState } from "./types";

export const TURTLE_MESSAGES: Record<TurtleState, string> = {
  idle: "오늘도 천천히, 바른 자세로 가요.",
  alert: "목 집어넣을 시간이에요!",
  stretch: "30초만 같이 해봐요.",
  success: "좋아요! 오늘도 성공이에요."
};

export const PRAISE_MESSAGES = [
  "오늘의 작은 습관 성공!",
  "목과 어깨에게 좋은 선물을 줬어요.",
  "거북이가 박수치는 중이에요!",
  "잠깐의 스트레칭, 아주 잘했어요.",
  "좋아요! 한 번 더 가벼워졌어요."
] as const;
