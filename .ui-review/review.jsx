import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GameLayout from '../src/layouts/GameLayout.jsx';
import Dashboard from '../src/pages/Dashboard.jsx';
import '../src/index.css';
createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/game']}><Routes><Route element={<GameLayout />}><Route path="/game" element={<Dashboard />} /></Route></Routes></MemoryRouter>);
