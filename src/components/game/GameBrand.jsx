import { Link } from "react-router-dom";
export default function GameBrand({ large = false }) {
  return (
    <Link
      to="/"
      className={`game-brand ${large ? "large" : ""}`}
      title="Retour au menu principal"
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="17" />
        <ellipse cx="24" cy="24" rx="8" ry="17" />
        <path d="M7 24h34M11 14h26M11 34h26M24 2v7M24 39v7M2 24h7M39 24h7" />
      </svg>
      <span>CIRIOUS</span>
      {!large && (
        <small>
          Global
          <br />
          Defense
        </small>
      )}
    </Link>
  );
}
