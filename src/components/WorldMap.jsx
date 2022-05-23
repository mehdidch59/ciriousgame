import { motion } from 'framer-motion';
import { useState } from 'react';

const WorldMap = ({ countries, onCountrySelect }) => {
    const [hoveredCountry, setHoveredCountry] = useState(null);

    // Helpers
    const getCountryColor = (country) => {
        if (country.infected === 0) return '#374151'; // Gray-700 (Stable)
        const infectionRate = country.infected / country.population;
        if (infectionRate > 0.5) return '#000000'; // Devastated
        // Interpolate Red intensity?
        // Simple: Red
        return '#ef4444';
    };

    // Calculate color transition
    // Framer motion 'animate' prop handles interpolation if we pass hex colors.

    return (
        <div className="relative w-full h-full bg-[#0a0a0a] border border-gray-800 rounded overflow-hidden">
            <svg viewBox="0 0 800 400" className="w-full h-full">
                {/* 1. Connections (Lines between neighbors) */}
                <g className="opacity-20 pointer-events-none">
                    {countries.map(country => (
                        country.neighbors?.map(neighborId => {
                            const neighbor = countries.find(c => c.id === neighborId);
                            if (!neighbor) return null;
                            // Draw line
                            return (
                                <line
                                    key={`${country.id}-${neighborId}`}
                                    x1={country.coords[0]} y1={country.coords[1]}
                                    x2={neighbor.coords[0]} y2={neighbor.coords[1]}
                                    stroke={country.infected > 0 && neighbor.infected > 0 ? '#ef4444' : '#4b5563'}
                                    strokeWidth="0.5"
                                />
                            );
                        })
                    ))}
                </g>

                {/* 2. Nodes (Circles) */}
                {countries.map(country => (
                    <motion.circle
                        key={country.id}
                        cx={country.coords[0]}
                        cy={country.coords[1]}
                        r={country.population > 100000000 ? 5 : 3} // Size based on pop
                        fill={getCountryColor(country)}
                        animate={{ fill: getCountryColor(country) }}
                        transition={{ duration: 0.5 }}
                        stroke={hoveredCountry === country.id ? '#fff' : 'none'}
                        strokeWidth="1"
                        className="cursor-pointer hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"

                        onMouseEnter={() => setHoveredCountry(country.id)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        onClick={() => onCountrySelect(country)}
                    />
                ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredCountry && (
                <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded border border-gray-600 pointer-events-none">
                    {(() => {
                        const target = countries.find(c => c.id === hoveredCountry);
                        return target ? `${target.name} (Pop: ${(target.population / 1000000).toFixed(1)}M)` : '';
                    })()}
                </div>
            )}
        </div>
    );
};

export default WorldMap;
