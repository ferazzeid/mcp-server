import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const ActivityTracker: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) setData(toolOutput);
  }, []);

  if (!data) return <div className="loading">Loading activities...</div>;

  return (
    <div className="fastnow-widget">
      <div className="widget-header">
        <h2>🏃 Activity</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👟</div>
          <div className="stat-info">
            <div className="stat-value">{data.steps || 0}</div>
            <div className="stat-label">Steps</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{data.calories_burned || 0}</div>
            <div className="stat-label">Calories</div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={() => (window as any).openai?.callTool('start_walk', {})}>
          Start Walk
        </button>
        <button className="btn btn-secondary" onClick={() => (window as any).openai?.callTool('log_activity', {})}>
          Log Activity
        </button>
      </div>
    </div>
  );
};

const root = document.getElementById('fastnow-root');
if (root) createRoot(root).render(<ActivityTracker />);
export default ActivityTracker;

