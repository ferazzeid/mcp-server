import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

interface FastingData {
  fast_id: string;
  start_time: string;
  goal_hours: number;
  elapsed_hours: number;
  elapsed_minutes: number;
  progress_percent: number;
  status: 'active' | 'paused';
}

const FastingProgress: React.FC = () => {
  const [data, setData] = useState<FastingData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Get data from MCP
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) {
      setData(toolOutput);
    }

    // Update timer every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!data) {
    return <div className="loading">Loading your fast...</div>;
  }

  // Calculate real-time elapsed time
  const startTime = new Date(data.start_time);
  const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
  const elapsedHours = Math.floor(elapsed / 3600);
  const elapsedMinutes = Math.floor((elapsed % 3600) / 60);
  const elapsedSeconds = elapsed % 60;
  
  const goalSeconds = data.goal_hours * 3600;
  const progress = Math.min(100, (elapsed / goalSeconds) * 100);
  
  // Calculate circle progress
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleEndFast = async () => {
    if ((window as any).openai?.callTool) {
      await (window as any).openai.callTool('end_fast', {});
    }
  };

  const handlePauseFast = async () => {
    if ((window as any).openai?.callTool) {
      await (window as any).openai.callTool('pause_fast', {});
    }
  };

  // Determine fast type
  const isExtendedFast = data.goal_hours >= 24;
  const currentDay = Math.floor(elapsedHours / 24) + 1;
  const totalDays = Math.ceil(data.goal_hours / 24);

  // Extended fast milestones
  const milestones = [
    { hours: 16, label: 'Fat burning begins', icon: '🔥' },
    { hours: 24, label: 'Autophagy begins', icon: '♻️' },
    { hours: 36, label: 'Deep ketosis', icon: '⚡' },
    { hours: 48, label: 'Growth hormone peak', icon: '💪' },
    { hours: 72, label: 'Maximum benefits', icon: '🏆' }
  ];

  return (
    <div className="fastnow-widget fasting-progress">
      <div className="widget-header">
        <h2>{isExtendedFast ? '💪 Extended Fast' : '🟢 Fasting Now'}</h2>
        <span className={`status-badge ${data.status}`}>{data.status}</span>
      </div>

      <div className="progress-container">
        <svg className="progress-ring" width="200" height="200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="12"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            className="progress-circle"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
        </svg>

        <div className="progress-text">
          <div className="time-display">
            <span className="hours">{elapsedHours}</span>
            <span className="separator">:</span>
            <span className="minutes">{String(elapsedMinutes).padStart(2, '0')}</span>
            <span className="separator">:</span>
            <span className="seconds">{String(elapsedSeconds).padStart(2, '0')}</span>
          </div>
          <div className="goal-text">{data.goal_hours}h goal</div>
          <div className="progress-percentage">{progress.toFixed(0)}%</div>
        </div>
      </div>

      {isExtendedFast && (
        <div className="extended-fast-header">
          <h3>💪 Extended Fast</h3>
          <div className="day-counter">
            Day {currentDay} of {totalDays}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Started</div>
          <div className="stat-value">
            {new Date(data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{isExtendedFast ? 'Elapsed' : 'Goal Time'}</div>
          <div className="stat-value">
            {isExtendedFast ? `${elapsedHours}h ${elapsedMinutes}m` : new Date(startTime.getTime() + goalSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Remaining</div>
          <div className="stat-value">
            {Math.max(0, data.goal_hours - elapsedHours)}h {Math.max(0, 60 - elapsedMinutes)}m
          </div>
        </div>
      </div>

      {isExtendedFast && (
        <div className="milestones">
          <h4>Milestones</h4>
          <div className="milestone-list">
            {milestones.map((milestone) => {
              const reached = elapsedHours >= milestone.hours;
              return (
                <div key={milestone.hours} className={`milestone ${reached ? 'reached' : ''}`}>
                  <div className="milestone-icon">{reached ? '✅' : '🔲'}</div>
                  <div className="milestone-info">
                    <div className="milestone-time">{milestone.hours}hr</div>
                    <div className="milestone-label">
                      {milestone.icon} {milestone.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="action-buttons">
        {data.status === 'active' && (
          <>
            <button className="btn btn-secondary" onClick={handlePauseFast}>
              ⏸️ Pause
            </button>
            <button className="btn btn-primary" onClick={handleEndFast}>
              ✅ End Fast
            </button>
          </>
        )}
        {data.status === 'paused' && (
          <>
            <button className="btn btn-primary" onClick={() => (window as any).openai?.callTool('resume_fast', {})}>
              ▶️ Resume
            </button>
            <button className="btn btn-danger" onClick={handleEndFast}>
              🛑 End Fast
            </button>
          </>
        )}
      </div>

      <div className="motivational-message">
        {!isExtendedFast && progress < 100 && progress >= 90 && (
          <div className="eating-window-alert">
            ⏰ Eating window opens in {Math.floor((goalSeconds - elapsed) / 60)}m
          </div>
        )}
        {progress < 50 && "💪 You're doing great! Keep going!"}
        {progress >= 50 && progress < 90 && "🔥 Amazing! You're past halfway!"}
        {progress >= 90 && progress < 100 && !isExtendedFast && "🎉 Almost there! Final stretch!"}
        {isExtendedFast && progress < 100 && `🔋 ${Math.ceil((data.goal_hours - elapsedHours) / 24)} days to go. Stay strong!`}
        {progress >= 100 && "🏆 Goal reached! Incredible work!"}
      </div>
    </div>
  );
};

// Mount component
const root = document.getElementById('fastnow-root');
if (root) {
  createRoot(root).render(<FastingProgress />);
}

export default FastingProgress;

