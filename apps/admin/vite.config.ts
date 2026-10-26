import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@distribuidora/tipos-compartidos': resolve(__dirname, '../../packages/tipos-compartidos/src/inventario.tipos.ts'),
    },
  },
});
