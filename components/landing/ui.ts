// Shared design tokens for the landing page (silver/white on near-black).

export const DISPLAY = 'font-(family-name:--font-display)'
export const MONO = 'font-(family-name:--font-mono)'

// Dark glass card with a faint inner top highlight.
// No backdrop-blur: it sits on a solid background, so blur was invisible but slow on iPhone.
export const GLASS =
  'relative rounded-2xl border border-white/8 bg-white/3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'

export const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-8'

const BTN_BASE =
  'group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold ' +
  'transition-[transform,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export const BTN_PRIMARY = `${BTN_BASE} bg-white text-black hover:bg-white/90`
export const BTN_SECONDARY = `${BTN_BASE} border border-white/20 text-white hover:border-white/40 hover:bg-white/5`

// Small mono section label, e.g. "01 / FEATURES"
export const LABEL = `${MONO} text-xs font-medium uppercase tracking-[0.18em] text-white/50`

export const H2 = `${DISPLAY} text-[34px] leading-[1.02] font-extrabold tracking-[-0.04em] text-white sm:text-5xl`
