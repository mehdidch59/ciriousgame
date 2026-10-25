export const AUDIO_KEY = "cirious.audio.v1";
export function audioCue(previous, next) {
  if (!previous || previous.missionRevision !== next.missionRevision) return null;
  if (previous.status !== next.status && ["VICTORY", "DEFEAT"].includes(next.status)) return "ending";
  if (previous.globalStats.research < 100 && next.globalStats.research === 100) return "research";
  if (next.countries.some(c => c.infected > 0 && previous.countries.find(p => p.id === c.id)?.infected === 0)) return "warning";
  if (previous.globalStats.day === next.globalStats.day && next.decisions.length > previous.decisions.length) return "order";
  return null;
}
export function readVolume(raw) {
  const value = Number(raw);
  return raw !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
}
