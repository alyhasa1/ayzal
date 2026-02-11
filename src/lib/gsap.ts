import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureScrollTrigger() {
  if (typeof window === "undefined") return false;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileOrCoarse = window.matchMedia("(max-width: 1023px), (pointer: coarse)").matches;
  if (reduceMotion || mobileOrCoarse) return false;

  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }

  return true;
}
