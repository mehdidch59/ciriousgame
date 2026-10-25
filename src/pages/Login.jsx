import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Key, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const email = username + "@cirious.game";
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in:", username);
            navigate('/game');
        } catch (err) {
            console.error(err);
            alert('Login error: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-plague-bg flex items-center justify-center relative overflow-hidden">
            {/* Background Map Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] text-plague-text animate-pulse" strokeWidth={0.5} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-plague-panel border border-gray-700 shadow-2xl p-8 relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-mono text-plague-accent tracking-widest font-bold mb-2">GLOBAL DEFENSE</h1>
                    <div className="h-0.5 bg-plague-accent w-1/3 mx-auto"></div>
                    <p className="text-xs text-gray-500 mt-2 uppercase">Secure Terminal // Medical Clearance</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs text-plague-highlight uppercase font-bold flex items-center gap-2">
                            <User size={12} /> Agent ID
                        </label>
                        <input
                            type="text"
                            className="w-full bg-black/50 border border-gray-600 p-3 text-white focus:border-plague-highlight focus:outline-none focus:ring-1 focus:ring-plague-highlight transition-all font-mono"
                            placeholder="OPERATIVE NAME"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-plague-highlight uppercase font-bold flex items-center gap-2">
                            <Key size={12} /> Access Code
                        </label>
                        <input
                            type="password"
                            className="w-full bg-black/50 border border-gray-600 p-3 text-white focus:border-plague-highlight focus:outline-none focus:ring-1 focus:ring-plague-highlight transition-all font-mono"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gray-800 hover:bg-plague-accent hover:text-white text-gray-400 border border-gray-600 hover:border-plague-accent py-3 uppercase font-bold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        <Lock size={16} className="group-hover:hidden" />
                        <span className="hidden group-hover:inline">Grant Access</span>
                        <span className="group-hover:hidden">Authenticate</span>
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/register')}
                        className="text-[10px] text-gray-600 hover:text-plague-highlight uppercase tracking-widest"
                    >
                        Request New Clearance (Register)
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
