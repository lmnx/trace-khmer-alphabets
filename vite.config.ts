import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { cspPlugin } from './plugins/csp.ts';

export default defineConfig({
  // Relative base: one build works at <user>.github.io/<repo>/ and on a custom domain.
  base: './',
  plugins: [react(), tailwindcss(), cspPlugin()],
  test: {
    // *.spec.ts files are Playwright tests.
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
  },
});
