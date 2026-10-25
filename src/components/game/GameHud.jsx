import { Activity, ShieldCheck, Heart, Coins } from "lucide-react";
import GameBrand from "./GameBrand";
import { formatNumber } from "../../game/format.mjs";
export default function GameHud({ stats }) {
  return (
    <header className="game-hud">
      <GameBrand />
      <dl className="hud-values">
        <div className="infection">
          <dt>
            <Activity size={15} aria-hidden="true" />
            Cas actifs
          </dt>
          <dd>{formatNumber(stats.totalInfected)}</dd>
          <small
            className="hud-delta"
            title="Variation des cas actifs sur le dernier jour"
          >
            {stats.delta > 0 ? "+" : ""}
            {formatNumber(stats.delta)} / jour
          </small>
        </div>
        <div>
          <dt>
            <ShieldCheck size={15} aria-hidden="true" />
            Immunisés
          </dt>
          <dd>{formatNumber(stats.totalImmune)}</dd>
        </div>
        <div>
          <dt>
            <Heart size={15} aria-hidden="true" />
            Confiance
          </dt>
          <dd>
            {Math.floor(stats.trust)}
            <small> %</small>
          </dd>
        </div>
        <div className="budget">
          <dt>
            <Coins size={15} aria-hidden="true" />
            Budget
          </dt>
          <dd>
            {stats.points}
            <small> PC</small>
          </dd>
        </div>
      </dl>
    </header>
  );
}
