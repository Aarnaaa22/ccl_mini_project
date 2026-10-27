import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    define: {
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(
        env.REACT_APP_API_BASE_URL || 'http://35.170.78.127:8080'
      ),
    },
  };
});
