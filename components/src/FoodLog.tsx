import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  consumed: boolean;
  created_at: string;
}

interface FoodLogData {
  entries: FoodEntry[];
  totals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
  count: number;
  calorie_goal?: number;
}

const FoodLog: React.FC = () => {
  const [data, setData] = useState<FoodLogData | null>(null);

  useEffect(() => {
    const toolOutput = (window as any).openai?.toolOutput;
    if (toolOutput) {
      setData(toolOutput);
    }
  }, []);

  if (!data) {
    return <div className="loading">Loading your food log...</div>;
  }

  const calorieProgress = data.calorie_goal 
    ? (data.totals.calories / data.calorie_goal) * 100 
    : 0;

  const handleDeleteFood = async (foodId: string) => {
    if ((window as any).openai?.callTool) {
      await (window as any).openai.callTool('delete_food', { food_id: foodId });
    }
  };

  const handleToggleConsumed = async (foodId: string, consumed: boolean) => {
    if ((window as any).openai?.callTool) {
      const tool = consumed ? 'mark_food_consumed' : 'mark_food_unconsumed';
      await (window as any).openai.callTool(tool, { food_id: foodId });
    }
  };

  // Calculate macro percentages
  const totalMacros = data.totals.carbs * 4 + data.totals.protein * 4 + data.totals.fat * 9;
  const macroPercent = {
    carbs: totalMacros > 0 ? ((data.totals.carbs * 4) / totalMacros) * 100 : 33,
    protein: totalMacros > 0 ? ((data.totals.protein * 4) / totalMacros) * 100 : 33,
    fat: totalMacros > 0 ? ((data.totals.fat * 9) / totalMacros) * 100 : 33,
  };

  return (
    <div className="fastnow-widget food-log">
      <div className="widget-header">
        <h2>🍽️ Today's Nutrition</h2>
        <span className="entry-count">{data.count} items</span>
      </div>

      {/* Calorie Progress Bar */}
      {data.calorie_goal && (
        <div className="calorie-progress-section">
          <div className="progress-header">
            <span className="progress-label">Daily Goal</span>
            <span className="progress-value">
              {data.totals.calories} / {data.calorie_goal} cal
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${calorieProgress > 100 ? 'over-goal' : ''}`}
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
          {calorieProgress > 100 && (
            <div className="warning-text">⚠️ {Math.round(data.totals.calories - data.calorie_goal)} cal over goal</div>
          )}
        </div>
      )}

      {/* Macros Summary */}
      <div className="macros-grid">
        <div className="macro-card carbs">
          <div className="macro-icon">🌾</div>
          <div className="macro-info">
            <div className="macro-value">{data.totals.carbs}g</div>
            <div className="macro-label">Carbs</div>
            <div className="macro-percent">{macroPercent.carbs.toFixed(0)}%</div>
          </div>
        </div>
        <div className="macro-card protein">
          <div className="macro-icon">🥩</div>
          <div className="macro-info">
            <div className="macro-value">{data.totals.protein}g</div>
            <div className="macro-label">Protein</div>
            <div className="macro-percent">{macroPercent.protein.toFixed(0)}%</div>
          </div>
        </div>
        <div className="macro-card fat">
          <div className="macro-icon">🥑</div>
          <div className="macro-info">
            <div className="macro-value">{data.totals.fat}g</div>
            <div className="macro-label">Fat</div>
            <div className="macro-percent">{macroPercent.fat.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Food Entries List */}
      <div className="food-entries">
        <h3>Food Log</h3>
        {data.entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <p>No food logged yet today</p>
            <button className="btn btn-primary" onClick={() => (window as any).openai?.callTool('log_food', {})}>
              + Add Food
            </button>
          </div>
        ) : (
          <div className="entries-list">
            {data.entries.map((entry) => (
              <div key={entry.id} className={`food-entry ${!entry.consumed ? 'not-consumed' : ''}`}>
                <div className="entry-checkbox">
                  <input
                    type="checkbox"
                    checked={entry.consumed}
                    onChange={() => handleToggleConsumed(entry.id, !entry.consumed)}
                  />
                </div>
                <div className="entry-details">
                  <div className="entry-name">{entry.name}</div>
                  <div className="entry-macros">
                    {entry.calories} cal • {entry.carbs}g carbs • {entry.protein}g protein • {entry.fat}g fat
                  </div>
                </div>
                <button 
                  className="btn-icon delete-btn" 
                  onClick={() => handleDeleteFood(entry.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.entries.length > 0 && (
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={() => (window as any).openai?.callTool('log_food', {})}>
            + Add Food
          </button>
          <button className="btn btn-danger" onClick={() => (window as any).openai?.callTool('clear_todays_food', {})}>
            🗑️ Clear All
          </button>
        </div>
      )}
    </div>
  );
};

// Mount component
const root = document.getElementById('fastnow-root');
if (root) {
  createRoot(root).render(<FoodLog />);
}

export default FoodLog;

