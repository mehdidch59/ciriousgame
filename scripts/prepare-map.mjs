import { readFileSync, writeFileSync } from "node:fs";
const data = JSON.parse(readFileSync("public/world.geojson"));
const project = ([lon, lat]) => [
  ((lon + 180) * 800) / 360,
  ((90 - lat) * 400) / 180,
];
function area(ring) {
  return Math.abs(
    ring.reduce((sum, point, i) => {
      const next = ring[(i + 1) % ring.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0),
  );
}
const features = data.features.map((f) => {
  const polygons =
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates]
      : f.geometry.type === "MultiPolygon"
        ? f.geometry.coordinates
        : [];
  const mainland = polygons
    .map((polygon) => polygon[0])
    .sort((a, b) => area(b) - area(a))[0];
  const points = mainland.map(project);
  const center = [
    (Math.min(...points.map((p) => p[0])) +
      Math.max(...points.map((p) => p[0]))) /
      2,
    (Math.min(...points.map((p) => p[1])) +
      Math.max(...points.map((p) => p[1]))) /
      2,
  ].map((value) => Number(value.toFixed(1)));
  return {
    center,
    id: f.properties.ISO_A2_EH || f.properties.ISO_A2,
    name: f.properties.NAME,
    path: polygons
      .map((poly) =>
        poly
          .map(
            (ring) =>
              ring
                .map(
                  (point, i) =>
                    `${i ? "L" : "M"}${project(point)
                      .map((v) => v.toFixed(1))
                      .join(",")}`,
                )
                .join("") + "Z",
          )
          .join(""),
      )
      .join(""),
  };
});
writeFileSync("public/world-map.json", JSON.stringify(features));
const countries = JSON.parse(readFileSync("src/data/pays.json"));
writeFileSync(
  "src/data/world-overview.json",
  JSON.stringify({ countryCount: countries.length }) + "\n",
);
