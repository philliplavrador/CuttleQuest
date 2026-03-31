export interface DrawArgs {
  ctx: CanvasRenderingContext2D;
  t: number;
  sprite?: HTMLImageElement | null;    // grayscale base sprite for tinting
  spriteColor?: HTMLImageElement | null; // color eyeless sprite (fallback)
  tintColor?: string | null;            // cosmetic color to apply
}
