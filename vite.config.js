import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react()],
        base: mode === 'production' ? '/GaaS-Framework-Afinz/' : '/',
        server: {
            port: 3000,
            open: true,
            host: '0.0.0.0'
        }
    });
});
