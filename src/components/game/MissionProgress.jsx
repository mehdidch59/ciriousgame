import { Check, ChevronRight } from "lucide-react";
import {
  missionMilestones,
  missionObjective,
} from "../../game/presentation.mjs";
export default function MissionProgress({ state, onNavigate }) {
  const milestones = missionMilestones(state),
    objective = missionObjective(state);
  const current = ["READY", "VICTORY", "DEFEAT"].includes(state.status)
    ? -1
    : milestones.findIndex((m) => !m.done);
  return (
    <section className="mission-progress" aria-label="Jalons de la mission">
      <ol>
        {milestones.map((milestone, i) => (
          <li
            key={milestone.label}
            className={
              milestone.done ? "complete" : i === current ? "current" : ""
            }
            aria-current={i === current ? "step" : undefined}
          >
            <span>
              {milestone.done ? <Check size={13} aria-hidden="true" /> : i + 1}
            </span>
            {milestone.label}
            <span className="sr-only">
              {milestone.done ? "atteint" : "non atteint"}
            </span>
          </li>
        ))}
      </ol>
      <button
        onClick={() => onNavigate(objective.target)}
        disabled={!objective.target}
      >
        <span>
          Objectif actuel<strong>{objective.text}</strong>
        </span>
        {objective.target && <ChevronRight size={16} aria-hidden="true" />}
      </button>
    </section>
  );
}
