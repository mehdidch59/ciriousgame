import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
function World({ borders, turn }) {
  const group = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => {
    const vertices = [];
    const point = ([lon, lat]) => {
      const phi = (lat * Math.PI) / 180,
        theta = (lon * Math.PI) / 180;
      return [
        1.006 * Math.cos(phi) * Math.sin(theta),
        1.006 * Math.sin(phi),
        1.006 * Math.cos(phi) * Math.cos(theta),
      ];
    };
    for (const feature of borders.features) {
      const polygons =
        feature.geometry.type === "Polygon"
          ? [feature.geometry.coordinates]
          : feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates
            : [];
      for (const polygon of polygons)
        for (const ring of polygon)
          for (let i = 1; i < ring.length; i++)
            vertices.push(...point(ring[i - 1]), ...point(ring[i]));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    return g;
  }, [borders]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group ref={group} rotation={[0.12, turn, 0]}>
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          e.target.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1 && group.current) {
            group.current.rotation.y += e.movementX * 0.007;
            group.current.rotation.x = Math.max(
              -0.6,
              Math.min(0.6, group.current.rotation.x + e.movementY * 0.005),
            );
            invalidate();
          }
        }}
      >
        <sphereGeometry args={[1, 64, 40]} />
        <meshStandardMaterial color="#172f40" roughness={0.88} />
      </mesh>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#9daea9" transparent opacity={0.68} />
      </lineSegments>
      <mesh scale={1.055}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial
          color="#91c6d1"
          wireframe
          transparent
          opacity={0.025}
        />
      </mesh>
    </group>
  );
}
class GlobeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function UnavailableGlobe({ onUnavailable }) {
  useEffect(() => {
    onUnavailable(true);
  }, [onUnavailable]);
  return null;
}
export default function TitleGlobe() {
  const [borders, setBorders] = useState(null);
  const [turn, setTurn] = useState(-0.35);
  const [resetKey, setResetKey] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/world.geojson", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("globe");
        return r.json();
      })
      .then(setBorders)
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!borders || unavailable) return null;
  return (
    <GlobeBoundary>
      <section
        className="title-globe"
        aria-label="Globe terrestre décoratif, orientable"
      >
        <div className="globe-canvas" aria-hidden="true">
          <Canvas
            frameloop="demand"
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 3], fov: 45 }}
            gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
            fallback={<UnavailableGlobe onUnavailable={setUnavailable} />}
            onCreated={() => setReady(true)}
          >
            <ambientLight intensity={1.1} />
            <directionalLight
              position={[-3, 4, 5]}
              intensity={2.5}
              color="#f0dbac"
            />
            <World key={resetKey} borders={borders} turn={turn} />
          </Canvas>
        </div>
        {ready && (
          <div className="globe-controls">
            <button
              aria-label="Tourner le globe vers la gauche"
              onClick={() => setTurn((v) => v - 0.3)}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span>Atlas mondial</span>
            <button
              aria-label="Tourner le globe vers la droite"
              onClick={() => setTurn((v) => v + 0.3)}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button
              aria-label="Recentrer le globe"
              onClick={() => {
                setTurn(-0.35);
                setResetKey((value) => value + 1);
              }}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </GlobeBoundary>
  );
}
