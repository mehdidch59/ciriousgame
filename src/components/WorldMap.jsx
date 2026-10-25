import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Minus, LocateFixed } from "lucide-react";
import { countryMapState, directionalCountry } from "../game/interface.mjs";
import MapSymbol from "./game/MapSymbol";
let mapPromise;
const loadMap = () =>
  (mapPromise ||= fetch("/world-map.json")
    .then((response) => {
      if (!response.ok) throw Error("Map unavailable");
      return response.json();
    })
    .catch((error) => {
      mapPromise = undefined;
      throw error;
    }));
function WorldMap({
  countries,
  onCountrySelect,
  selectedCountryId,
  layer = "infection",
  interactive = true,
  onDossier,
  onBrowse,
  newFoyers = [],
  feedback,
}) {
  const [features, setFeatures] = useState([]),
    [failed, setFailed] = useState(false),
    [hoverId, setHoverId] = useState(null),
    [zoom, setZoom] = useState(1),
    [focusId, setFocusId] = useState(null);
  const countryRefs = useRef(new Map());
  const patternId = useId().replace(/:/g, "");
  const countryIndex = useMemo(
    () => new Map(countries.map((country) => [country.id, country])),
    [countries],
  );
  const hovered =
      countryIndex.get(hoverId) ||
      features.find((feature) => feature.id === hoverId),
    selectedFeature = features.find(
      (feature) => feature.id === selectedCountryId,
    ),
    selectedCountry = countryIndex.get(selectedCountryId),
    focusFeature = features.find((feature) => feature.id === focusId),
    center =
      zoom > 1
        ? focusFeature?.center || selectedFeature?.center || [400, 200]
        : [400, 200];
  const enabledFeatures = useMemo(
    () => features.filter((feature) => countryIndex.has(feature.id)),
    [features, countryIndex],
  );
  const tabStopId =
    focusId ||
    (enabledFeatures.some((feature) => feature.id === selectedCountryId)
      ? selectedCountryId
      : enabledFeatures[0]?.id);
  useEffect(() => {
    let active = true;
    loadMap()
      .then((data) => {
        if (active) setFeatures(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const color = (country) =>
    country?.id === selectedCountryId
      ? "var(--map-selected-fill)"
      : countryMapState(country, layer).fill;
  return (
    <div className={`world-map ${interactive ? "interactive" : "decorative"}`}>
      <svg
        className="map-svg"
        viewBox={`${center[0] - 400 / zoom} ${center[1] - 200 / zoom} ${800 / zoom} ${400 / zoom}`}
        role={interactive ? "group" : "img"}
        aria-describedby={interactive ? `map-help-${patternId}` : undefined}
        aria-label={
          interactive
            ? "Carte mondiale interactive. Les petits pays sont également accessibles dans le panneau Pays."
            : "Carte du monde"
        }
      >
        <defs>
          <pattern
            id={`contours-${patternId}`}
            width="130"
            height="95"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M-20 38Q10 3 42 28T112 24T160 6M-20 44Q10 9 42 34T112 30T160 12M-20 50Q10 15 42 40T112 36T160 18M-20 56Q10 21 42 46T112 42T160 24M-20 62Q10 27 42 52T112 48T160 30"
              fill="none"
              stroke="var(--map-contour)"
              strokeWidth=".4"
              opacity=".42"
            />
          </pattern>
        </defs>
        <rect
          x="-800"
          y="-400"
          width="2400"
          height="1200"
          fill={`url(#contours-${patternId})`}
        />
        <g className="map-graticule" aria-hidden="true">
          {[100, 200, 300].map((y) => (
            <path key={`lat-${y}`} d={`M0 ${y}H800`} />
          ))}
          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
            <path key={`lon-${x}`} d={`M${x} 0V400`} />
          ))}
        </g>
        <g>
          {features.map((feature) => {
            const country = countryIndex.get(feature.id),
              enabled = interactive && Boolean(country);
            return (
              <path
                key={feature.id + feature.name}
                d={feature.path}
                fill={color(country)}
                stroke={
                  country?.id === selectedCountryId
                    ? "var(--map-selected-border)"
                    : "var(--map-border)"
                }
                strokeOpacity={country?.id === selectedCountryId ? 1 : 0.48}
                strokeWidth={country?.id === selectedCountryId ? 0.9 : 0.38}
                vectorEffect="non-scaling-stroke"
                role={enabled ? "button" : undefined}
                ref={(element) => {
                  if (element) countryRefs.current.set(feature.id, element);
                  else countryRefs.current.delete(feature.id);
                }}
                tabIndex={
                  enabled ? (feature.id === tabStopId ? 0 : -1) : undefined
                }
                aria-label={
                  enabled
                    ? `${country.name}, ${country.infected.toLocaleString("fr-FR")} cas actifs${layer === "response" ? `, ${countryMapState(country, layer).label}` : ""}`
                    : undefined
                }
                aria-pressed={
                  enabled ? country.id === selectedCountryId : undefined
                }
                onMouseEnter={
                  interactive ? () => setHoverId(feature.id) : undefined
                }
                onMouseLeave={interactive ? () => setHoverId(null) : undefined}
                onFocus={
                  enabled
                    ? () => {
                        setFocusId(feature.id);
                        setHoverId(feature.id);
                      }
                    : undefined
                }
                onBlur={
                  enabled
                    ? (event) => {
                        setHoverId(null);
                        if (
                          !event.currentTarget.ownerSVGElement?.contains(
                            event.relatedTarget,
                          )
                        )
                          setFocusId(null);
                      }
                    : undefined
                }
                onClick={enabled ? () => onCountrySelect(country) : undefined}
                onKeyDown={
                  enabled
                    ? (event) => {
                        if (
                          [
                            "ArrowRight",
                            "ArrowLeft",
                            "ArrowUp",
                            "ArrowDown",
                            "Home",
                            "End",
                          ].includes(event.key)
                        ) {
                          event.preventDefault();
                          event.stopPropagation();
                          const next =
                            event.key === "Home"
                              ? enabledFeatures[0]?.id
                              : event.key === "End"
                                ? enabledFeatures.at(-1)?.id
                                : directionalCountry(
                                    enabledFeatures,
                                    feature.id,
                                    event.key,
                                  );
                          countryRefs.current
                            .get(next)
                            ?.focus({ preventScroll: true });
                          return;
                        }
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onCountrySelect(country);
                        }
                      }
                    : undefined
                }
              >
                <title>{country?.name || feature.name}</title>
              </path>
            );
          })}
        </g>
        <g className="map-ocean-labels" aria-hidden="true">
          <text x="190" y="225">
            Océan Pacifique
          </text>
          <text x="330" y="220">
            Océan Atlantique
          </text>
          <text x="565" y="258">
            Océan Indien
          </text>
          <text x="717" y="225">
            Océan Pacifique
          </text>
        </g>
        <g aria-hidden="true" className="map-markers">
          {features.map((feature) => {
            const country = countryIndex.get(feature.id);
            const state = countryMapState(country, layer);
            if (["stable", "none"].includes(state.id) || !feature.center)
              return null;
            const scale =
              layer === "response"
                ? 1
                : Math.min(
                    5,
                    1.5 + Math.sqrt(country.infected / country.population) * 14,
                  ) / (state.symbol === "circle" ? 4 : 2.5);
            return (
              <MapSymbol
                key={feature.id}
                state={state}
                transform={`translate(${feature.center.join(" ")}) scale(${scale / zoom})`}
              />
            );
          })}
        </g>
        {interactive && layer === "infection" && (
          <g aria-hidden="true" className="map-alert-rings">
            {features
              .filter((f) => newFoyers.includes(f.id) && f.center)
              .map((f) => (
                <g key={f.id} transform={`translate(${f.center.join(" ")})`}>
                  <circle className="new-foyer-ring" r={10 / zoom} />
                </g>
              ))}
          </g>
        )}
        {interactive && layer === "infection" && (
          <g aria-hidden="true" className="response-overlays">
            {features.map((f) => {
              const c = countryIndex.get(f.id);
              if (!c || !f.center) return null;
              const response = countryMapState(c, "response");
              return response.id === "none" ? null : (
                <MapSymbol
                  key={f.id}
                  state={response}
                  transform={`translate(${f.center[0] + 9 / zoom} ${f.center[1] - 8 / zoom}) scale(${1.1 / zoom})`}
                />
              );
            })}
          </g>
        )}
        {interactive && feedback?.countryId && (
          <g aria-hidden="true" className="map-order-ring">
            {features
              .filter((f) => f.id === feedback.countryId && f.center)
              .map((f) => (
                <g
                  key={feedback.key}
                  transform={`translate(${f.center.join(" ")}) scale(${1 / zoom})`}
                >
                  <circle r="16" />
                </g>
              ))}
          </g>
        )}
        {selectedFeature?.center && (
          <g
            className="map-selection"
            aria-hidden="true"
            transform={`translate(${selectedFeature.center.join(" ")}) scale(${1 / zoom})`}
          >
            <circle r="7" />
            <path d="M-12 0H-5M5 0H12M0-12V-5M0 5V12" />
          </g>
        )}
      </svg>
      {interactive && (
        <>
          <div className="map-selection-caption">
            <span>Pays sélectionné</span>
            <strong>{selectedCountry?.name || selectedFeature?.name}</strong>
            {onDossier && (
              <button onClick={onDossier}>Ouvrir le dossier</button>
            )}
            {onBrowse && <button onClick={onBrowse}>Rechercher un pays</button>}
          </div>
          <p className="sr-only" id={`map-help-${patternId}`}>
            Un seul arrêt Tab pour la carte. Explorez les pays avec les flèches,
            puis choisissez avec Entrée. Tab permet de quitter la carte.
          </p>
          {onDossier && (
            <button className="map-dossier-shortcut" onClick={onDossier}>
              Aller au dossier régional
            </button>
          )}
          <div className="map-tooltip" role="status">
            {hovered ? (
              <>
                <strong>{hovered.name}</strong>
                <span>
                  {hovered.infected !== undefined
                    ? `${hovered.infected.toLocaleString("fr-FR")} cas actifs`
                    : "Zone non simulée"}
                </span>
              </>
            ) : failed ? (
              <span>Carte indisponible. Utilisez le panneau Pays.</span>
            ) : !features.length ? (
              <span>Chargement de la carte…</span>
            ) : null}
          </div>
          <div className="map-zoom">
            <button
              aria-label="Réduire le zoom"
              disabled={zoom === 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <button
              aria-label="Zoomer sur le pays sélectionné"
              disabled={zoom === 3}
              onClick={() => setZoom((value) => Math.min(3, value + 0.5))}
            >
              <Plus size={18} aria-hidden="true" />
            </button>
            <button
              aria-label="Recentrer la carte du monde"
              onClick={() => setZoom(1)}
            >
              <LocateFixed size={18} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
export default memo(WorldMap);
