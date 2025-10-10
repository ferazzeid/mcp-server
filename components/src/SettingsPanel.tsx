import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const SettingsPanel: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) setData(toolOutput);
  }, []);

  if (!data) return <div className="loading">Loading settings...</div>;

  return (
    <div className="fastnow-widget">
      <div className="widget-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-list">
        <div className="setting-item">
          <span>🌓 Theme</span>
          <select value={data.theme || 'light'} onChange={(e) => (window as any).openai?.callTool('set_theme', { theme: e.target.value })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="setting-item">
          <span>📏 Units</span>
          <select value={data.units || 'metric'} onChange={(e) => (window as any).openai?.callTool('set_units', { units: e.target.value })}>
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lbs, in)</option>
          </select>
        </div>

        <div className="setting-item">
          <span>⏱️ Default Fast</span>
          <input 
            type="number" 
            value={data.default_fast_duration_hours || 16} 
            onChange={(e) => (window as any).openai?.callTool('set_default_fast_duration', { hours: parseInt(e.target.value) })}
            min="1"
            max="72"
          />
          <span>hours</span>
        </div>

        <div className="setting-item">
          <span>🥩 Track Protein/Fat</span>
          <input 
            type="checkbox" 
            checked={data.show_protein_fat || false}
            onChange={(e) => (window as any).openai?.callTool('enable_protein_tracking', { enabled: e.target.checked })}
          />
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('fastnow-root');
if (root) createRoot(root).render(<SettingsPanel />);
export default SettingsPanel;

