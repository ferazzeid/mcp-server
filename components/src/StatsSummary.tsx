import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const StatsSummary: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) setData(toolOutput);
  }, []);

  if (!data) return <div className="loading">Loading stats...</div>;

  return (
    <div className="fastnow-widget">
      <div className="widget-header">
        <h2>📊 Your Stats</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <div className="stat-value">{data.total_fasts || 0}</div>
            <div className="stat-label">Total Fasts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{data.total_hours || 0}h</div>
            <div className="stat-label">Fasting Hours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <div className="stat-value">{data.weight_lost || 0}kg</div>
            <div className="stat-label">Weight Lost</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = document.getElementById('fastnow-root');
if (root) createRoot(root).render(<StatsSummary />);
export default StatsSummary;

