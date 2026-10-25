import { useMemo, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { formatNumber, normalize } from "../../game/format.mjs";
import { COUNTRY_SORTS, compareCountries } from "../../game/strategy.mjs";
import { regionalTrend } from "../../game/learning.mjs";
export default function CountriesPanel({
  countries,
  selectedId,
  onSelect,
  initialAffectedOnly = false,
}) {
  const [query, setQuery] = useState(""),
    [affectedOnly, setAffectedOnly] = useState(initialAffectedOnly),
    [sort, setSort] = useState("cases");
  function sortValue(c) {
    if (sort === "prevalence") {
      const percent = (c.infected / c.population) * 100;
      return percent > 0 && percent < 0.01
        ? "< 0,01 %"
        : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(percent)} %`;
    }
    if (sort === "growth") {
      const trend = regionalTrend(c);
      return trend?.days === 7
        ? `${trend.delta > 0 ? "+" : ""}${formatNumber(trend.delta)} / 7 j`
        : "Historique insuffisant";
    }
    return c.infected ? formatNumber(c.infected) : "Stable";
  }
  const filtered = useMemo(
    () =>
      countries
        .filter(
          (c) =>
            (!affectedOnly || c.infected > 0) &&
            normalize(`${c.name} ${c.id}`).includes(normalize(query)),
        )
        .sort((a, b) => compareCountries(a, b, sort)),
    [countries, query, affectedOnly, sort],
  );
  return (
    <div className="countries-content">
      <header className="drawer-heading">
        <h2>Pays surveillés</h2>
        <span>{filtered.length}</span>
      </header>
      <label className="country-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          name="country-search"
          autoComplete="off"
          aria-label="Rechercher un pays"
          placeholder="Nom ou code du pays…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="country-sort">
        Trier les pays
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(COUNTRY_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p className="country-sort-hint">
        {sort === "growth"
          ? "Variation en nombre de cas actifs, sur sept jours complets. Les historiques plus courts sont placés à la fin."
          : sort === "prevalence"
            ? "Du pourcentage de population touchée le plus élevé au plus faible."
            : "Du plus grand nombre de cas actifs au plus faible."}
      </p>
      <label className="affected-filter">
        <input
          type="checkbox"
          checked={affectedOnly}
          onChange={(e) => setAffectedOnly(e.target.checked)}
        />
        Afficher les foyers actifs
      </label>
      <div className="country-list">
        {filtered.length ? (
          filtered.map((c) => (
            <button
              key={c.id}
              aria-label={`${c.name}, ${c.infected ? `${formatNumber(c.infected)} cas actifs` : "aucun cas actif"}${sort !== "cases" ? `, ${sortValue(c)}` : ""}`}
              aria-current={c.id === selectedId ? "true" : undefined}
              className="country-row"
              onClick={() => onSelect(c.id)}
            >
              <span>{c.id}</span>
              <strong>{c.name}</strong>
              <small className={c.infected ? "infection" : ""}>
                {sortValue(c)}
              </small>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          ))
        ) : (
          <p className="empty-state">
            Aucun pays simulé ne correspond à votre recherche.
          </p>
        )}
      </div>
    </div>
  );
}
