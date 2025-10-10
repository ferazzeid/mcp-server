import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

interface Goal {
  id: string;
  goal: string;
  completed: boolean;
  created_at: string;
  completed_at?: string;
}

const GoalsDashboard: React.FC = () => {
  const [data, setData] = useState<{ goals: Goal[] } | null>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) setData(toolOutput);
  }, []);

  if (!data) return <div className="loading">Loading goals...</div>;

  const activeGoals = data.goals.filter(g => !g.completed);
  const completedGoals = data.goals.filter(g => g.completed);

  return (
    <div className="fastnow-widget">
      <div className="widget-header">
        <h2>🎯 Goals</h2>
        <span className="entry-count">{activeGoals.length} active</span>
      </div>

      <div className="goals-list">
        {activeGoals.map(goal => (
          <div key={goal.id} className="goal-item">
            <input type="checkbox" onChange={() => (window as any).openai?.callTool('complete_goal', { goal_id: goal.id })} />
            <span>{goal.goal}</span>
          </div>
        ))}
      </div>

      {completedGoals.length > 0 && (
        <>
          <h3>✅ Completed</h3>
          <div className="goals-list completed">
            {completedGoals.map(goal => (
              <div key={goal.id} className="goal-item completed">
                <span>✓ {goal.goal}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn btn-primary" onClick={() => (window as any).openai?.callTool('create_goal', {})}>
        + Add Goal
      </button>
    </div>
  );
};

const root = document.getElementById('fastnow-root');
if (root) createRoot(root).render(<GoalsDashboard />);
export default GoalsDashboard;

