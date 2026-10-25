export const WORLD_MAP_DATA = {
    // Simplified SVG Paths and Neighbors (Adjacency)
    "FR": {
        path: "M400,150 L420,150 L420,170 L400,170 Z", // Placeholder Box
        neighbors: ["US", "RU", "ZA"], // Flight paths? Or generic neighbors
        viewBox: "0 0 800 400"
    },
    // Adding rough paths for visual representation. 
    // In a real app we'd use a proper GeoJSON or detailed SVG.
    // Making stylized "Hex/Tech" look for Savior Mode.

    "FR": {
        name: "France",
        d: "M390 130 L410 130 L415 140 L410 155 L390 155 L385 140 Z",
        neighbors: ["ZA", "RU", "US"]
    },
    "US": {
        name: "United States",
        d: "M120 120 L180 120 L190 150 L160 180 L110 170 L110 140 Z",
        neighbors: ["BR", "FR", "CN"]
    },
    "CN": {
        name: "China",
        d: "M550 140 L620 130 L640 160 L610 190 L560 180 Z",
        neighbors: ["RU", "IN", "AU"]
    },
    "BR": {
        name: "Brazil",
        d: "M220 230 L270 230 L280 280 L250 320 L210 290 Z",
        neighbors: ["US", "ZA"]
    },
    "RU": {
        name: "Russia",
        d: "M450 60 L650 60 L660 120 L580 130 L450 120 Z",
        neighbors: ["CN", "FR"]
    },
    "AU": {
        name: "Australia",
        d: "M620 280 L690 280 L680 340 L610 330 Z",
        neighbors: ["CN", "IN"]
    },
    "IN": {
        name: "India",
        d: "M510 180 L560 180 L550 230 L520 230 Z",
        neighbors: ["CN", "AU", "ZA"]
    },
    "ZA": {
        name: "South Africa",
        d: "M400 300 L450 300 L440 360 L410 360 Z",
        neighbors: ["BR", "FR", "IN"]
    }
};
