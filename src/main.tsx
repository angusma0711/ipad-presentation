import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import './style.css';
// Each page loads separately, so the projector never downloads the QR code or preview code.
const StartPage = lazy(() => import('./pages/StartPage').then(module => ({ default: module.StartPage })));
const PresentPage = lazy(() => import('./pages/PresentPage').then(module => ({ default: module.PresentPage })));
const ControlPage = lazy(() => import('./pages/ControlPage').then(module => ({ default: module.ControlPage })));
const PreviewPage = lazy(() => import('./pages/PreviewPage').then(module => ({ default: module.PreviewPage })));
const SolfegePage = lazy(() => import('./activities/solfege/SolfegePage').then(module => ({ default: module.SolfegePage })));
const Router=import.meta.env.VITE_PAGES==='true'?HashRouter:BrowserRouter;
createRoot(document.getElementById('root')!).render(<React.StrictMode><Router><Suspense fallback={<p className="page-loading">載入中…</p>}><Routes><Route path="/activities/solfege" element={<SolfegePage/>}/><Route path="/preview/:deckId" element={<PreviewPage/>}/><Route path="/start" element={<StartPage />}/><Route path="/present/:sessionId" element={<PresentPage />}/><Route path="/control/:sessionId" element={<ControlPage />}/><Route path="*" element={<Navigate to="/start" replace/>}/></Routes></Suspense></Router></React.StrictMode>);
