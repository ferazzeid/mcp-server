import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        'fasting-progress': resolve(__dirname, 'src/FastingProgress.tsx'),
        'food-log': resolve(__dirname, 'src/FoodLog.tsx'),
        'weight-progress': resolve(__dirname, 'src/WeightProgress.tsx'),
        'goals-dashboard': resolve(__dirname, 'src/GoalsDashboard.tsx'),
        'stats-summary': resolve(__dirname, 'src/StatsSummary.tsx'),
        'journey-tracker': resolve(__dirname, 'src/JourneyTracker.tsx'),
        'activity-tracker': resolve(__dirname, 'src/ActivityTracker.tsx'),
        'settings-panel': resolve(__dirname, 'src/SettingsPanel.tsx'),
      },
      formats: ['es'],
      fileName: (format, name) => `${name}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});

