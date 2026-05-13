/**
 * Instagram templates barrel file.
 * Re-exports all templates and utilities for backward compatibility.
 */

// Colors and constants
export { colors, INSTA_DIMENSIONS, type InstaFormat } from './colors.ts';

// Primitives (internal use, but exported for extensibility)
export {
  containerStyle,
  TrilingualFooter,
  QRCorner,
  SunAccent,
  SunMandala,
} from './primitives.tsx';

// Templates
export { QuoteTemplate, type QuoteTemplateProps } from './quote.tsx';
export { TitleTemplate, type TitleTemplateProps } from './title.tsx';
export { StatusTemplate, type StatusTemplateProps } from './status.tsx';
export { SpecimenTemplate, StatusIcon, type SpecimenTemplateProps } from './specimen.tsx';
export {
  MetalogueTemplate,
  DialogueGlyph,
  isNarratorSpeaker,
  type MetalogueFragment,
  type MetalogueTemplateProps,
} from './metalogue.tsx';
export { IntroSlideTemplate, type IntroSlideTemplateProps } from './intro.tsx';
