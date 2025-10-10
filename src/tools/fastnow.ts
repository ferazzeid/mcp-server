import { supabaseAdmin } from '../config/supabase';

// Tool: Start Fasting Session
export async function startFast(userId: string, userToken: string, goalHours: number) {
  // Use admin client since we've already validated the OAuth token
  const supabase = supabaseAdmin;
  
  // Check for existing active fast
  const { data: existingFast } = await supabase
    .from('fasting_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (existingFast) {
    return {
      success: false,
      error: 'You already have an active fasting session. End it first before starting a new one.'
    };
  }
  
  const now = new Date().toISOString();
  const goalSeconds = Math.floor(goalHours * 3600);
  
  const { data, error } = await supabase
    .from('fasting_sessions')
    .insert({
      user_id: userId,
      start_time: now,
      goal_duration_seconds: goalSeconds,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to start fast: ${error.message}`);
  }
  
  return {
    success: true,
    message: `Fasting session started! Goal: ${goalHours} hours`,
    data: {
      fast_id: data.id,
      start_time: data.start_time,
      goal_hours: goalHours
    }
  };
}

// Tool: End Fasting Session
export async function endFast(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  // Find active fast
  const { data: activeFast, error: findError } = await supabase
    .from('fasting_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (findError) {
    throw new Error(`Failed to find fasting session: ${findError.message}`);
  }
  
  if (!activeFast) {
    return {
      success: false,
      error: 'No active fasting session found'
    };
  }
  
  const now = new Date().toISOString();
  const startTime = new Date(activeFast.start_time).getTime();
  const endTime = Date.now();
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  const durationHours = (durationSeconds / 3600).toFixed(2);
  const goalHours = (activeFast.goal_duration_seconds / 3600).toFixed(2);
  
  // Determine if goal was reached
  const goalReached = durationSeconds >= activeFast.goal_duration_seconds;
  const status = goalReached ? 'completed' : 'ended_early';
  
  // Update session
  const { error: updateError } = await supabase
    .from('fasting_sessions')
    .update({
      end_time: now,
      duration_seconds: durationSeconds,
      status: status,
      updated_at: now
    })
    .eq('id', activeFast.id);
  
  if (updateError) {
    throw new Error(`Failed to end fast: ${updateError.message}`);
  }
  
  return {
    success: true,
    message: goalReached
      ? `Congratulations! You completed your ${goalHours}h fast!`
      : `Fast ended after ${durationHours} hours (goal was ${goalHours}h)`,
    data: {
      fast_id: activeFast.id,
      duration_hours: Number(durationHours),
      goal_hours: Number(goalHours),
      goal_reached: goalReached,
      status: status
    }
  };
}

// Tool: Log Food Entry
export async function logFood(
  userId: string,
  userToken: string,
  args: {
    name: string;
    calories: number;
    carbs: number;
    protein?: number;
    fat?: number;
    serving_size?: number;
  }
) {
  const supabase = supabaseAdmin;
  
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('food_entries')
    .insert({
      user_id: userId,
      name: args.name,
      calories: args.calories,
      carbs: args.carbs,
      protein: args.protein || 0,
      fat: args.fat || 0,
      serving_size: args.serving_size || 100,
      consumed: true,
      source_date: now.split('T')[0],
      created_at: now
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to log food: ${error.message}`);
  }
  
  return {
    success: true,
    message: `Logged: ${args.name} (${args.calories} cal, ${args.carbs}g carbs)`,
    data: {
      food_id: data.id,
      name: data.name,
      calories: Number(data.calories),
      carbs: Number(data.carbs),
      logged_at: data.created_at
    }
  };
}

// Tool: Log Weight Entry
export async function logWeight(
  userId: string,
  userToken: string,
  weightKg: number
) {
  const supabase = supabaseAdmin;
  
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('weight_entries')
    .insert({
      user_id: userId,
      weight_kg: weightKg,
      recorded_at: now
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to log weight: ${error.message}`);
  }
  
  // Also update profile with latest weight
  await supabase
    .from('profiles')
    .update({ weight: weightKg })
    .eq('user_id', userId);
  
  return {
    success: true,
    message: `Weight logged: ${weightKg} kg`,
    data: {
      weight_id: data.id,
      weight_kg: Number(data.weight_kg),
      recorded_at: data.recorded_at
    }
  };
}

// Tool: Start Walking Session
export async function startWalk(userId: string, userToken: string) {
  const supabase = supabaseAdmin;
  
  // Check for existing active walk
  const { data: existingWalk } = await supabase
    .from('walking_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (existingWalk) {
    return {
      success: false,
      error: 'You already have an active walking session'
    };
  }
  
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('walking_sessions')
    .insert({
      user_id: userId,
      start_time: now,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to start walk: ${error.message}`);
  }
  
  return {
    success: true,
    message: 'Walking session started!',
    data: {
      walk_id: data.id,
      start_time: data.start_time
    }
  };
}

// Tool: End Walking Session
export async function endWalk(
  userId: string,
  userToken: string,
  args: {
    distance_meters?: number;
    calories_burned?: number;
  }
) {
  const supabase = supabaseAdmin;
  
  // Find active walk
  const { data: activeWalk, error: findError } = await supabase
    .from('walking_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  
  if (findError) {
    throw new Error(`Failed to find walking session: ${findError.message}`);
  }
  
  if (!activeWalk) {
    return {
      success: false,
      error: 'No active walking session found'
    };
  }
  
  const now = new Date().toISOString();
  
  // Update session
  const { error: updateError } = await supabase
    .from('walking_sessions')
    .update({
      end_time: now,
      distance: args.distance_meters || null,
      calories_burned: args.calories_burned || null,
      status: 'completed',
      updated_at: now
    })
    .eq('id', activeWalk.id);
  
  if (updateError) {
    throw new Error(`Failed to end walk: ${updateError.message}`);
  }
  
  const durationMinutes = Math.floor((Date.now() - new Date(activeWalk.start_time).getTime()) / 60000);
  
  return {
    success: true,
    message: `Walking session completed! Duration: ${durationMinutes} minutes`,
    data: {
      walk_id: activeWalk.id,
      duration_minutes: durationMinutes,
      distance_meters: args.distance_meters || 0,
      calories_burned: args.calories_burned || 0
    }
  };
}


