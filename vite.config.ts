import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { networkInterfaces } from 'node:os';

export default defineConfig(({ command }) => {
    const currentLanHost = () => {
    const interfaces = networkInterfaces();
    const candidates = Object.entries(interfaces)
        .filter(([name]) => !/^(lo|utun|tun|tap|docker)/.test(name))
        .sort(([a], [b]) => (a === 'en0' ? -1 : b === 'en0' ? 1 : 0))
        .flatMap(([, addresses]) => addresses ?? []);
    return candidates.find(address => address.family === 'IPv4' && !address.internal)?.address ?? '';
    };
    const lanHost = currentLanHost();
    return {
        plugins: [react(), {name:'current-lan-host',configureServer(server){server.middlewares.use('/__lan-host',(_request,response)=>{response.setHeader('Content-Type','application/json');response.setHeader('Cache-Control','no-store');response.end(JSON.stringify({host:currentLanHost()}));});}}],
        server: { host: '0.0.0.0' },
        // Libraries change rarely, so they get their own long-cached chunks.
        build: { chunkSizeWarningLimit: 600, rollupOptions: { output: { manualChunks(id: string) { if (/node_modules\/.*(@firebase|\/firebase)\//.test(id)) return 'firebase'; if (/node_modules\/.*\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react'; } } } },
        define: { __PRESENTATION_LAN_HOST__: JSON.stringify(command === 'serve' ? lanHost : '') },
    };
});
