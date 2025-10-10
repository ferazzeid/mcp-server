import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const JourneyTracker: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) setData(toolOutput);
  }, []);

  if (!data) return <div className="loading">Loading journey...</div>;

  const progress = (data.day / 90) * 100;

  return (
    <div className="fastnow-widget">
      <div className="widget-header">
        <h2>🚀 90-Day Journey</h2>
      </div>

      <div className="journey-progress">
        <div className="day-display">
          <span className="day-number">{data.day}</span>
          <span className="day-label">/ 90 Days</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{90 - data.day}</div>
          <div className="stat-label">Days Remaining</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{progress.toFixed(0)}%</div>
          <div className="stat-label">Complete</div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => (window as any).openai?.callTool('close_journey_day', {})}>
        ✅ Close Today
      </button>
    </div>
  );
};

const root = document.getElementById('fastnow-root');
if (root) createRoot(root).render(<JourneyTracker />);
export default JourneyTracker;

