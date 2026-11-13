// Short vibration patterns. Uses the Vibration API, which works on Android
// browsers; iOS Safari does not support it, so calls are silently ignored there.

const KEY = 'hexdoku:haptics';

export const PATTERNS = {
  select: 6,
  place: 12,
  mark: [8, 40, 8],
  wrong: [40, 50, 40],
  win: [20, 60, 20, 60, 80],
} satisfies Record<string, number | number[]>;

export type Haptic = keyof typeof PATTERNS;

export const hapticsSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

let enabled = (() => {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
})();

export const hapticsEnabled = () => enabled;

export function setHaptics(on: boolean) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* ignore */ }
  if (on) buzz('place');
}

export function buzz(kind: Haptic) {
  if (!enabled || !hapticsSupported) return;
  try { navigator.vibrate(PATTERNS[kind]); } catch { /* ignore */ }
}
