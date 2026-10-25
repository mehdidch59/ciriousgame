import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Activity, Globe, ShieldAlert, Wifi } from 'lucide-react';
import { useGameEngine } from '../hooks/useGameEngine';

const GameLayout = () => {
    // View State: 'MAP', 'RESEARCH', 'INTEL'
    const [activeView, setActiveView] = useState('INTEL');

    // Centralize Game Engine State here
    const { state, actions } = useGameEngine();
    const stats = state.globalStats || { totalPopulation: 0, totalInfected: 0, totalCured: 0, totalDead: 0, day: 0, points: 0 };

    return (
        <div className="flex flex-col h-screen w-screen bg-plague-bg text-plague-text font-sans overflow-hidden select-none">
            {/* Top HUD Bar */}
            <header className="h-14 bg-plague-panel border-b border-gray-700 flex items-center justify-between px-6 shadow-md z-50">
                <div className="flex items-center gap-4">
                    <span className="text-xl font-bold tracking-widest text-plague-accent font-mono">GLOBAL.DEFENSE</span>
                    <div className="h-6 w-px bg-gray-600 mx-2"></div>
                    <div className="flex items-center text-xs text-gray-400 gap-2">
                        <Activity size={14} className={`text-plague-highlight ${state.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                        <span>STATUS: {state.status}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Survivors</span>
                        <span className="text-plague-text font-bold">
                            {Math.floor(stats.totalPopulation - stats.totalDead).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Cured</span>
                        <span className="text-plague-highlight font-bold">
                            {Math.floor(stats.totalCured).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Infected</span>
                        <span className="text-red-500 font-bold">
                            {Math.floor(stats.totalInfected).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 uppercase">Dead</span>
                        <span className="text-gray-400 font-bold">
                            {Math.floor(stats.totalDead).toLocaleString()}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area (Map/Dashboard) */}
            <main className="flex-1 relative overflow-hidden">
                {/* Grid Overlay for tech feel */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

                {/* Pass state and actions via context so Dashboard can use them */}
                <Outlet context={{ activeView, setActiveView, state, actions }} />
            </main>

            {/* Bottom Controls Bar */}
            <footer className="h-20 bg-plague-panel border-t border-gray-700 flex items-center justify-center gap-8 px-6 z-50">
                <MenuButton
                    icon={<Globe />}
                    label="Global Map"
                    active={activeView === 'MAP'}
                    onClick={() => setActiveView('MAP')}
                />
                <MenuButton
                    icon={<ShieldAlert />}
                    label="Research"
                    active={activeView === 'RESEARCH'}
                    onClick={() => setActiveView('RESEARCH')}
                />
                <MenuButton
                    icon={<Wifi />}
                    label="Intel Feed"
                    active={activeView === 'INTEL'}
                    onClick={() => setActiveView('INTEL')}
                />
            </footer>
        </div>
    );
};

const MenuButton = ({ icon, label, active = false, onClick }) => (
    <button
        onClick={onClick}
        className={`
        flex flex-col items-center justify-center gap-1 w-24 h-full 
        transition-all duration-200 
        ${active ? 'bg-gray-800 border-t-2 border-plague-accent text-white shadow-[0_-5px_15px_rgba(6,182,212,0.1)]' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}
    `}>
        {React.cloneElement(icon, { size: 20 })}
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </button>
);

export default GameLayout;
