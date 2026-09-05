import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/game/physics.ts',
        'src/game/geometry.ts',
        'src/game/session.ts',
      ],
      reporter: ['text', 'json-summary'],
      thresholds: { statements: 90, lines: 90, functions: 90, branches: 80 },
    },
  },
});
