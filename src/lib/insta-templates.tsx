/**
 * JSX templates for Instagram image generation with Satori.
 * Square (1080×1080) and Portrait (1080×1350) formats.
 *
 * This file re-exports from the modular structure in ./insta-templates/
 * for backward compatibility with existing imports.
 */

export {
  // Colors and constants
  colors,
  INSTA_DIMENSIONS,
  type InstaFormat,
  // Primitives
  containerStyle,
  TrilingualFooter,
  QRCorner,
  SunAccent,
  SunMandala,
  // Templates
  QuoteTemplate,
  type QuoteTemplateProps,
  TitleTemplate,
  type TitleTemplateProps,
  StatusTemplate,
  type StatusTemplateProps,
  SpecimenTemplate,
  StatusIcon,
  type SpecimenTemplateProps,
  MetalogueTemplate,
  DialogueGlyph,
  isNarratorSpeaker,
  type MetalogueFragment,
  type MetalogueTemplateProps,
  IntroSlideTemplate,
  type IntroSlideTemplateProps,
} from './insta-templates/index.ts';
