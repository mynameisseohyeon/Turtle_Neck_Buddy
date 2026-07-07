import type { TurtleState } from "./types";

export type OverlayVisibilityState = "hidden" | "peeking" | "alert" | "stretch" | "success";

export type OverlayViewState = {
  visibilityState: OverlayVisibilityState;
  turtleState: TurtleState;
  message: string;
  remainingSeconds?: number;
};

export const INITIAL_OVERLAY_VIEW_STATE: OverlayViewState = {
  visibilityState: "hidden",
  turtleState: "idle",
  message: ""
};
