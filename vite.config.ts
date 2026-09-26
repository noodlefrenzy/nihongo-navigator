import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], build: { target: 'es2022' },
  server: { proxy: { '/judge-translation': 'http://127.0.0.1:8787', '/place-content': 'http://127.0.0.1:8787' } } });
