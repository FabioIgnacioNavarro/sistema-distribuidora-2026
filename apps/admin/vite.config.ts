import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const rutaTiposCompartidos = fileURLToPath(
  new URL('../../packages/tipos-compartidos/src/inventario.tipos.ts', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@distribuidora/tipos-compartidos': rutaTiposCompartidos,
    },
  },
});
