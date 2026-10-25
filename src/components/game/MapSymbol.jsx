export default function MapSymbol({ state, ...props }) {
  return (
    <g fill={state.color} stroke={state.color} strokeWidth="1" {...props}>
      {state.symbol === "cross" ? (
        <path d="M-4-1H-1V-4H1V-1H4V1H1V4H-1V1H-4Z" />
      ) : state.symbol === "diamond" ? (
        <path d="M0-5L5 0 0 5-5 0Z" />
      ) : state.symbol === "combined" ? (
        <>
          <path d="M0-5L5 0 0 5-5 0Z" fill="none" />
          <path d="M-2 0H2M0-2V2" />
        </>
      ) : (
        <circle r={state.symbol === "circle" ? 4 : 2.5} />
      )}
    </g>
  );
}
