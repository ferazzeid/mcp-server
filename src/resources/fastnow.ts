import { supabaseAdmin } from '../config/supabase';

// Resource: Current Fasting Session
export async function getCurrentFast(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  const { data, error } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    throw new Error(`Failed to fetch fasting session: ${error.message}`);
  }
  
  if (!data) {
    return {
      status: 'no_active_fast',
      message: 'No active fasting session'
    };
  }
  
  // Calculate progress
  const startTime = new Date(data.start_time).getTime();
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const elapsedHours = elapsedSeconds / 3600;
  const goalHours = data.goal_duration_seconds / 3600;
  const remainingHours = Math.max(0, goalHours - elapsedHours);
  const progressPercentage = Math.min(100, (elapsedHours / goalHours) * 100);
  
  return {
    id: data.id,
    start_time: data.start_time,
    goal_hours: goalHours,
    elapsed_hours: Number(elapsedHours.toFixed(2)),
    remaining_hours: Number(remainingHours.toFixed(2)),
    progress_percentage: Number(progressPercentage.toFixed(1)),
    status: data.status
  };
}

// Resource: Today's Food Entries
export async function getTodaysFood(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { data, error } = await supabase
    .from('food_entries')
    .select('id, name, calories, carbs, protein, fat, serving_size, consumed, created_at')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to fetch food entries: ${error.message}`);
  }
  
  const entries = data || [];
  const consumed = entries.filter((e: any) => e.consumed);
  
  const totals = consumed.reduce((acc: any, entry: any) => ({
    calories: acc.calories + (Number(entry.calories) || 0),
    carbs: acc.carbs + (Number(entry.carbs) || 0),
    protein: acc.protein + (Number(entry.protein) || 0),
    fat: acc.fat + (Number(entry.fat) || 0)
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
  
  return {
    date: today.toISOString().split('T')[0],
    entries: entries.map((e: any) => ({
      id: e.id,
      name: e.name,
      calories: Number(e.calories),
      carbs: Number(e.carbs),
      protein: Number(e.protein),
      fat: Number(e.fat),
      serving_size: Number(e.serving_size),
      consumed: e.consumed,
      time: e.created_at
    })),
    totals: {
      calories: Number(totals.calories.toFixed(0)),
      carbs: Number(totals.carbs.toFixed(1)),
      protein: Number(totals.protein.toFixed(1)),
      fat: Number(totals.fat.toFixed(1))
    },
    count: entries.length,
    consumed_count: consumed.length
  };
}

// Resource: Weight History
export async function getWeightHistory(userId: string, userToken: string, limit: number = 30) {
  const supabase = supabaseAdmin;
  
  const { data, error } = await supabase
    .from('weight_entries')
    .select('id, weight_kg, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch weight entries: ${error.message}`);
  }
  
  const entries = data || [];
  
  if (entries.length === 0) {
    return {
      entries: [],
      count: 0,
      message: 'No weight entries recorded'
    };
  }
  
  const currentWeight = Number(entries[0].weight_kg);
  const oldestWeight = Number(entries[entries.length - 1].weight_kg);
  const totalChange = currentWeight - oldestWeight;
  const percentChange = ((totalChange / oldestWeight) * 100).toFixed(1);
  
  return {
    entries: entries.map((e: any) => ({
      id: e.id,
      weight_kg: Number(e.weight_kg),
      recorded_at: e.recorded_at
    })),
    count: entries.length,
    current_weight_kg: currentWeight,
    oldest_weight_kg: oldestWeight,
    total_change_kg: Number(totalChange.toFixed(2)),
    percent_change: Number(percentChange)
  };
}

// Resource: User Profile
export async function getUserProfile(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, weight, height, age, daily_calorie_goal, daily_carb_goal, access_level, premium_expires_at')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
  
  return {
    display_name: data.display_name,
    weight_kg: data.weight ? Number(data.weight) : null,
    height_cm: data.height,
    age: data.age,
    daily_calorie_goal: data.daily_calorie_goal,
    daily_carb_goal: data.daily_carb_goal,
    access_level: data.access_level,
    is_premium: data.access_level === 'premium' || data.access_level === 'admin',
    premium_expires_at: data.premium_expires_at
  };
}

// Resource: Daily Summary
export async function getDailySummary(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [fasting, food, walking, weight, profile] = await Promise.all([
    // Current fasting
    supabase.from('fasting_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(),
    
    // Today's food
    supabase.from('food_entries')
      .select('calories, carbs, protein, fat, consumed')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()),
    
    // Today's walking
    supabase.from('walking_sessions')
      .select('distance, calories_burned, status')
      .eq('user_id', userId)
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString()),
    
    // Latest weight
    supabase.from('weight_entries')
      .select('weight_kg, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    
    // Profile for goals
    supabase.from('profiles')
      .select('daily_calorie_goal, daily_carb_goal')
      .eq('user_id', userId)
      .single()
  ]);
  
  // Calculate food totals
  const consumedFood = (food.data || []).filter((e: any) => e.consumed);
  const foodTotals = consumedFood.reduce((acc: any, entry: any) => ({
    calories: acc.calories + (Number(entry.calories) || 0),
    carbs: acc.carbs + (Number(entry.carbs) || 0),
    protein: acc.protein + (Number(entry.protein) || 0),
    fat: acc.fat + (Number(entry.fat) || 0)
  }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
  
  // Calculate walking totals
  const completedWalks = (walking.data || []).filter((w: any) => w.status === 'completed');
  const walkingTotals = completedWalks.reduce((acc: any, walk: any) => ({
    distance: acc.distance + (Number(walk.distance) || 0),
    calories_burned: acc.calories_burned + (Number(walk.calories_burned) || 0)
  }), { distance: 0, calories_burned: 0 });
  
  // Calculate calorie budget
  const dailyGoal = profile.data?.daily_calorie_goal || 2000;
  const netCalories = foodTotals.calories - walkingTotals.calories_burned;
  const remainingBudget = dailyGoal - netCalories;
  
  return {
    date: today.toISOString().split('T')[0],
    fasting: fasting.data ? {
      is_active: true,
      start_time: fasting.data.start_time,
      goal_hours: fasting.data.goal_duration_seconds / 3600,
      elapsed_hours: Number(((Date.now() - new Date(fasting.data.start_time).getTime()) / 3600000).toFixed(2))
    } : {
      is_active: false
    },
    nutrition: {
      consumed: foodTotals,
      burned: walkingTotals.calories_burned,
      net_calories: Number(netCalories.toFixed(0)),
      daily_goal: dailyGoal,
      remaining_budget: Number(remainingBudget.toFixed(0))
    },
    activity: {
      meals_logged: consumedFood.length,
      walks_completed: completedWalks.length,
      distance_meters: Number(walkingTotals.distance.toFixed(0))
    },
    weight: weight.data ? {
      current_kg: Number(weight.data.weight_kg),
      last_recorded: weight.data.recorded_at
    } : null
  };
}


