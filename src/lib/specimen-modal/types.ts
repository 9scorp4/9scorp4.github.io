/**
 * Type definitions for the specimen modal system
 */

/** Data required to open a specimen modal */
export interface SpecimenData {
  name: string;
  description: string;
  sketch: string;
  series?: string;
  seriesIndex?: number;
  aspectRatio?: string;
}

/** A sketch module loaded via dynamic import */
export interface SketchModule {
  createSketch: (
    container: HTMLElement,
    options: SketchOptions
  ) => SketchInstance;
}

/** Options passed to createSketch */
export interface SketchOptions {
  width: number;
  height: number;
  reducedMotion: boolean;
}

/** A running sketch instance with cleanup method */
export interface SketchInstance {
  remove: () => void;
}

/** Cached DOM element references */
export interface ModalRefs {
  modal: HTMLDivElement;
  closeBtn: HTMLButtonElement;
  canvasContainer: HTMLDivElement;
  loadingEl: HTMLDivElement;
  nameEl: HTMLHeadingElement;
  seriesEl: HTMLParagraphElement;
  descriptionEl: HTMLParagraphElement;
}
