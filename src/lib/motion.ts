import gsap from 'gsap';

export type MotionMode = 'desktop' | 'mobile';

export const MOTION_QUERIES = {
  desktop:
    '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023px), (pointer: coarse), (prefers-reduced-motion: reduce)',
} as const;

export function withGsapMedia(
  setup: (mode: MotionMode) => void | (() => void)
) {
  const mm = gsap.matchMedia();

  mm.add(MOTION_QUERIES.desktop, () => setup('desktop'));
  mm.add(MOTION_QUERIES.mobile, () => setup('mobile'));

  return () => mm.revert();
}
