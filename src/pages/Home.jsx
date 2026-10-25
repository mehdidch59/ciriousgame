import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Globe, Skull, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-plague-bg text-plague-text font-sans selection:bg-plague-accent selection:text-white overflow-hidden relative">
            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            <div className="max-w-6xl mx-auto px-6 pt-20 relative z-10">
                {/* Header */}
                <motion.header
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex justify-between items-center mb-20 border-b border-gray-800 pb-6"
                >
                    <div className="flex items-center gap-3">
                        <Skull className="text-plague-accent" size={32} />
                        <h1 className="text-3xl font-mono font-bold tracking-[0.2em]">CIRIOUS.GAME</h1>
                    </div>
                    <div className="flex gap-8 text-xs font-mono text-gray-400">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> SERVER ONLINE</span>
                        <span>V.1.0.4</span>
                    </div>
                </motion.header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-6xl font-bold mb-6 leading-tight">
                            GLOBAL <span className="text-plague-accent">DEFENSE</span> <br />
                            INITIATIVE
                        </h2>
                        <p className="text-xl text-gray-400 mb-8 font-light border-l-2 border-plague-accent pl-6">
                            Your goal is critical: Analyze, Contain, and Cure.
                            Deploy resources across a realistic world map, research vaccines,
                            and save humanity from extinction.
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-12">
                            <FeatureBox icon={<Globe />} title="Global Monitoring" desc="Track infection spread in real-time." />
                            <FeatureBox icon={<Activity />} title="Vaccine Research" desc="Develop cures and distribute treatments." />
                            <FeatureBox icon={<Zap />} title="Crisis Response" desc="Coordinate defenses with other players." />
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="bg-plague-accent hover:bg-blue-600 text-black px-12 py-4 text-lg font-bold tracking-widest uppercase transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center gap-4"
                        >
                            Initialize Defense
                            <Activity className="animate-pulse" />
                        </button>
                    </motion.div>

                    {/* Visual/Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-plague-accent/20 blur-3xl rounded-full"></div>
                        <div className="relative border border-gray-700 bg-gray-900/50 backdrop-blur-sm p-2 rounded-lg shadow-2xl">
                            {/* Abstract Map Representation */}
                            <div className="aspect-video bg-black rounded border border-gray-800 flex items-center justify-center overflow-hidden relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>
                                <Globe size={200} className="text-gray-700 opacity-50 absolute" strokeWidth={0.5} />
                                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-plague-accent rounded-full animate-ping"></div>
                                <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-plague-accent rounded-full animate-ping delay-75"></div>

                                <div className="absolute bottom-4 left-4 font-mono text-xs text-plague-highlight">
                                    &gt; SCANNING SURVIVORS...<br />
                                    &gt; HEALTHY: 7.8B
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

const FeatureBox = ({ icon, title, desc }) => (
    <div className="bg-gray-900/50 p-4 border border-gray-800 hover:border-plague-accent/50 transition-colors">
        <div className="text-plague-highlight mb-2">{icon}</div>
        <h3 className="font-bold text-sm mb-1 uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-gray-500">{desc}</p>
    </div>
);

export default Home;
