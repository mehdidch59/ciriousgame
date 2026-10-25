import { mapLegend, MAP_STATES } from "../../game/interface.mjs";
import MapSymbol from "./MapSymbol";
export default function MapLegend({ layer }) {
  return (
    <div
      className="map-legend"
      aria-label={
        layer === "response"
          ? "Légende des interventions"
          : "Légende de la propagation"
      }
    >
      {[
        ...mapLegend(layer),
        ...(layer === "infection"
          ? [MAP_STATES.team, MAP_STATES.quarantine, MAP_STATES.combined]
          : []),
      ].map((state) => (
        <span key={state.id}>
          <svg viewBox="-6 -6 12 12" width="14" height="14" aria-hidden="true">
            <MapSymbol state={state} />
          </svg>
          {state.label}
        </span>
      ))}
    </div>
  );
}
