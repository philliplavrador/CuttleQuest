/* ------------------------------------------------------------------ */
/*  Shared game types used across scenes and components                */
/* ------------------------------------------------------------------ */

/** Standard props passed to every scene component */
export interface SceneProps {
  onComplete: (stars: number, metrics: { label: string; value: string }[]) => void;
  onFail: (reason: string, explanation: string) => void;
  attemptNumber: number;
}

/** A single metric shown on the results screen */
export interface SceneMetric {
  label: string;
  value: string;
}
