import { useEffect, useRef, useState } from "react";
import { AUDIO_KEY, audioCue, readVolume } from "../game/audio.mjs";
export default function useGameAudio(state) {
  const [volume, setVolume] = useState(() => { try { return readVolume(localStorage.getItem(AUDIO_KEY)); } catch { return 0; } });
  const [unavailable, setUnavailable] = useState(false);
  const context = useRef(null), previous = useRef(state), level = useRef(volume), last = useRef(0);
  useEffect(() => {
    level.current = volume;
    try { localStorage.setItem(AUDIO_KEY, String(volume)); } catch { /* Preference remains available for this session. */ }
    if (volume === 0 && context.current?.state === "running") context.current.suspend().catch(() => {});
  }, [volume]);
  useEffect(() => {
    function unlock() {
      if (!level.current || document.hidden) return;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) { setUnavailable(true); return; }
        context.current ||= new Audio();
        context.current.resume().catch(() => setUnavailable(true));
      } catch { setUnavailable(true); }
    }
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    function background() { if (document.hidden) context.current?.suspend().catch(() => {}); }
    document.addEventListener("visibilitychange", background);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", background);
      context.current?.close().catch(() => {});
      context.current = null;
    };
  }, []);
  useEffect(() => {
    const cue = audioCue(previous.current, state);
    previous.current = state;
    const ctx = context.current;
    if (!cue || !volume || document.hidden || ctx?.state !== "running" || ctx.currentTime - last.current < 0.22) return;
    last.current = ctx.currentTime;
    const pitches = { order: [440], warning: [220, 196], research: [440, 554, 659], ending: [330, 440, 523] }[cue];
    pitches.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + index * 0.12;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12 * (volume / 100) ** 2, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + 0.12);
    });
  }, [state, volume]);
  return { volume, setVolume, unavailable };
}
