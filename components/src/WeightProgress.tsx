import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles.css';

interface WeightEntry {
  weight_kg: number;
  recorded_at: string;
}

interface WeightProgressData {
  current_weight: number;
  target_weight: number;
  starting_weight: number;
  history: WeightEntry[];
  total_to_lose: number;
  lost_so_far: number;
  remaining: number;
  percent_complete: number;
  bmi?: number;
  units: 'kg' | 'lbs';
}

const WeightProgress: React.FC = () => {
  const [data, setData] = useState<WeightProgressData | null>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) {
      setData(toolOutput);
    }
  }, []);

  if (!data) {
    return <div className="loading">Loading weight progress...</div>;
  }

  // Prepare chart data
  const chartData = data.history.map(entry => ({
    date: new Date(entry.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight_kg
  }));

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: '#3b82f6' };
    if (bmi < 25) return { category: 'Normal', color: '#10b981' };
    if (bmi < 30) return { category: 'Overweight', color: '#f59e0b' };
    return { category: 'Obese', color: '#ef4444' };
  };

  const bmiInfo = data.bmi ? getBMICategory(data.bmi) : null;

  return (
    <div className="fastnow-widget weight-progress">
      <div className="widget-header">
        <h2>⚖️ Weight Progress</h2>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <div className="weight-display">
          <div className="current-weight">
            <span className="label">Current</span>
            <span className="value">{data.current_weight} {data.units}</span>
          </div>
          <div className="arrow">→</div>
          <div className="target-weight">
            <span className="label">Target</span>
            <span className="value">{data.target_weight} {data.units}</span>
          </div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-labels">
            <span>{data.starting_weight} {data.units}</span>
            <span className="progress-percent">{data.percent_complete}%</span>
            <span>{data.target_weight} {data.units}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${data.percent_complete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card success">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <div className="stat-value">{Math.abs(data.lost_so_far).toFixed(1)} {data.units}</div>
            <div className="stat-label">Lost</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-value">{Math.abs(data.remaining).toFixed(1)} {data.units}</div>
            <div className="stat-label">To Go</div>
          </div>
        </div>
        {bmiInfo && (
          <div className="stat-card" style={{ borderColor: bmiInfo.color }}>
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-value">{data.bmi.toFixed(1)}</div>
              <div className="stat-label">BMI - {bmiInfo.category}</div>
            </div>
          </div>
        )}
      </div>

      {/* Weight Trend Chart */}
      {chartData.length > 1 && (
        <div className="chart-section">
          <h3>Weight Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#667eea" 
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn btn-primary"
          onClick={() => (window as any).openai?.callTool('update_weight', {})}
        >
          📝 Log Weight
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => (window as any).openai?.callTool('set_target_weight', {})}
        >
          🎯 Update Goal
        </button>
      </div>

      {/* Motivational Message */}
      {data.lost_so_far > 0 && (
        <div className="motivational-message success">
          🎉 Amazing! You've lost {Math.abs(data.lost_so_far).toFixed(1)} {data.units}!
          {data.percent_complete >= 50 && " You're over halfway there!"}
        </div>
      )}
    </div>
  );
};

// Mount component
const root = document.getElementById('fastnow-root');
if (root) {
  createRoot(root).render(<WeightProgress />);
}

export default WeightProgress;

