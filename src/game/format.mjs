export const formatNumber = (n) =>
  new Intl.NumberFormat("fr-FR", {
    notation: Math.abs(n) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(n);
export const normalize = (value) =>
  value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
