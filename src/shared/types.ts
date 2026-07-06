export type TurtleState = "idle" | "alert" | "stretch" | "success";

export type StretchCard = {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  guideText: string;
};
