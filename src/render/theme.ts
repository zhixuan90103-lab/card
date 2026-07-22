/**
 * Soft casual playing-card theme (reference: cream faces + mist-blue ornate backs).
 * Presentation only — does not affect rules.
 */
export const Theme = {
  /** Felt / table inside phone-frame */
  bg: 0xefe5d9,
  bgCss: '#EFE5D9',
  letterboxCss: '#2a2420',

  /** Puzzle card back — soft powder blue */
  back: 0x8fadc6,
  backStroke: 0xe8dcc8,
  backInner: 0xa3bfd4,
  backPattern: 0xb0c9da,
  backPatternDeep: 0x7a9eb8,

  /** Stock / draw pile — slightly cooler */
  backDraw: 0x7f9faf,
  backDrawStroke: 0xd8cfc0,
  backDrawInner: 0x91b0bc,

  /** Face — warm ivory */
  face: 0xfff8f0,
  faceStroke: 0xe0d2bc,
  faceInner: 0xf3e8da,
  faceStrokeSelected: 0xe8b44a,
  inkRed: 0xc62828,
  inkBlack: 0x1c1c1c,

  /** Soft drop */
  shadow: 0xb8a890,
  shadowDeep: 0x9a8b78,

  /** DOM HUD */
  textPrimary: '#5a4a3c',
  textSecondary: '#8a7a6a',
  textMuted: '#a89888',
  tip: '#b8860b',
  /**
   * Draw-area tray (from mock): warm peach-beige, slightly deeper than felt #EFE5D9
   * Felt #EFE5D9 → tray #EAD5C0
   */
  tray: 0xead5c0,
  trayCss: '#EAD5C0',

  btnDraw: '#6b9bb8',
  btnUndo: '#d4a08a',
  btnRestart: '#c4b5a0',
  btnNew: '#8fbc8f',
  btnText: '#ffffff',
  btnTextDark: '#5a4a3c',
} as const;
