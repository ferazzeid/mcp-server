/**
 * Comprehensive FastNow MCP Tool Definitions - All 108 Endpoints
 * Maps MCP tools to Supabase Edge Functions
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  endpoint: string;
  method: string;
  scopes: string[];
  component?: string; // Optional UI component URI
  readOnlyHint?: boolean; // True for read-only tools (skips confirmation)
}

export const FASTNOW_TOOLS: MCPTool[] = [
  // =====================================
  // FASTING TOOLS (12)
  // =====================================
  {
    name: "get_current_fast",
    description: "Use this when the user asks about their current fast, fasting progress, elapsed time, how long they've been fasting, or whether they're still fasting. Returns active fasting session with start time, goal, elapsed hours, and completion percentage. Do not use for past fasting history or statistics.",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-fasting/current",
    method: "GET",
    scopes: ["read:fasting"],
    component: "ui://widget/fasting-progress.html",
    readOnlyHint: true
  },
  {
    name: "start_fast",
    description: "Use this when the user wants to begin a new fasting period. Common phrases: 'start fasting', 'begin my fast', 'I want to fast for X hours'. Defaults to 16-hour intermittent fasting if no duration specified. Do not use if user already has an active fast.",
    inputSchema: {
      type: "object",
      properties: {
        goal_hours: { 
          type: "number", 
          description: "Fasting goal duration in hours. Common values: 12 (beginner), 14 (moderate), 16 (standard intermittent fasting), 18 (warrior diet), 20-24 (OMAD), 36-72 (extended fasting). Defaults to 16 if not specified.",
          minimum: 1,
          maximum: 72,
          examples: [16, 18, 24]
        }
      },
      required: []
    },
    endpoint: "/gpt-fasting/start",
    method: "POST",
    scopes: ["write:fasting"]
  },
  {
    name: "end_fast",
    description: "Use this when the user wants to stop or complete their current fast. Common phrases: 'end my fast', 'stop fasting', 'I'm done fasting', 'break my fast'. Only works if there's an active fasting session.",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-fasting/end",
    method: "POST",
    scopes: ["write:fasting"]
  },
  {
    name: "pause_fast",
    description: "Pause the current active fasting session",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-fasting/pause",
    method: "PUT",
    scopes: ["write:fasting"]
  },
  {
    name: "resume_fast",
    description: "Resume a paused fasting session",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-fasting/resume",
    method: "PUT",
    scopes: ["write:fasting"]
  },
  {
    name: "edit_fast",
    description: "Edit the current fast's start time or goal duration",
    inputSchema: {
      type: "object",
      properties: {
        start_time: { type: "string", description: "New start time (ISO 8601 format)" },
        goal_hours: { type: "number", description: "New goal duration in hours" }
      },
      required: []
    },
    endpoint: "/gpt-fasting/edit",
    method: "PUT",
    scopes: ["write:fasting"]
  },
  {
    name: "delete_fast",
    description: "Delete a specific fasting session by ID",
    inputSchema: {
      type: "object",
      properties: {
        fast_id: { type: "string", description: "UUID of the fasting session to delete" }
      },
      required: ["fast_id"]
    },
    endpoint: "/gpt-fasting",
    method: "DELETE",
    scopes: ["write:fasting"]
  },
  {
    name: "get_fasting_history",
    description: "Use this when the user asks about past fasts, fasting history, previous fasting sessions, or fasts from specific dates. Returns list of completed and ended fasting sessions. Do not use for current active fast (use get_current_fast instead).",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of sessions to return (default: 10)", examples: [5, 10, 20] },
        status: { type: "string", description: "Filter by status: 'completed' (reached goal), 'ended_early' (stopped before goal)", examples: ["completed", "ended_early"] }
      },
      required: []
    },
    endpoint: "/gpt-fasting/history",
    method: "GET",
    scopes: ["read:fasting"],
    readOnlyHint: true
  },
  {
    name: "get_fasting_stats",
    description: "Use this when the user asks for fasting statistics, progress summary, how many times they've fasted, total fasting hours, average fast length, or their longest fast. Returns aggregated statistics for the specified period. Do not use for current active fast (use get_current_fast instead).",
    inputSchema: {
      type: "object",
      properties: {
        period: { type: "string", description: "Time period for stats: 'all' (lifetime), 'week' (last 7 days), 'month' (last 30 days). Defaults to 'all'.", examples: ["all", "week", "month"] }
      },
      required: []
    },
    endpoint: "/gpt-fasting/stats",
    method: "GET",
    scopes: ["read:fasting"],
    component: "ui://widget/stats-summary.html",
    readOnlyHint: true
  },
  {
    name: "get_fasting_streak",
    description: "Get the user's current fasting streak (consecutive days)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-fasting/streak",
    method: "GET",
    scopes: ["read:fasting"]
  },

  // =====================================
  // FOOD TOOLS (14)
  // =====================================
  {
    name: "get_todays_food",
    description: "Use this when the user asks what they ate today, their food log, calorie count, macros consumed, or daily nutrition. Returns all food entries for today with totals for calories, carbs, protein, and fat. Do not use for specific dates in the past (use get_food_by_date instead).",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-food/today",
    method: "GET",
    scopes: ["read:food"],
    component: "ui://widget/food-log.html",
    readOnlyHint: true
  },
  {
    name: "log_food",
    description: "Use this when the user wants to track food they ate or are about to eat. Common phrases: 'log my lunch', 'track 200g chicken', 'I ate a salad', 'add food'. Requires food name and calorie count at minimum. If user provides weight/quantity (e.g., '200g chicken'), use serving_size parameter.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the food item (e.g., 'Grilled chicken breast', 'Caesar salad', 'Banana')", examples: ["Grilled chicken breast", "Brown rice", "Greek yogurt"] },
        calories: { type: "number", description: "Total calories in kcal for this serving", examples: [165, 350, 100] },
        carbs: { type: "number", description: "Carbohydrates in grams (optional)", examples: [0, 45, 12] },
        protein: { type: "number", description: "Protein in grams (optional)", examples: [31, 8, 10] },
        fat: { type: "number", description: "Fat in grams (optional)", examples: [3.6, 15, 0.4] },
        serving_size: { type: "number", description: "Serving size in grams (default: 100g)", examples: [100, 200, 85] },
        consumed: { type: "boolean", description: "Whether already consumed (default: true). Set false for meal planning." }
      },
      required: ["name", "calories"]
    },
    endpoint: "/gpt-food",
    method: "POST",
    scopes: ["write:food"]
  },
  {
    name: "update_food",
    description: "Update a food entry's details",
    inputSchema: {
      type: "object",
      properties: {
        food_id: { type: "string", description: "UUID of the food entry" },
        name: { type: "string", description: "Updated name" },
        calories: { type: "number", description: "Updated calories" },
        carbs: { type: "number", description: "Updated carbs" },
        protein: { type: "number", description: "Updated protein" },
        fat: { type: "number", description: "Updated fat" }
      },
      required: ["food_id"]
    },
    endpoint: "/gpt-food/{food_id}",
    method: "PUT",
    scopes: ["write:food"]
  },
  {
    name: "delete_food",
    description: "Delete a food entry",
    inputSchema: {
      type: "object",
      properties: {
        food_id: { type: "string", description: "UUID of the food entry to delete" }
      },
      required: ["food_id"]
    },
    endpoint: "/gpt-food/{food_id}",
    method: "DELETE",
    scopes: ["write:food"]
  },
  {
    name: "mark_food_consumed",
    description: "Mark a food entry as consumed",
    inputSchema: {
      type: "object",
      properties: {
        food_id: { type: "string", description: "UUID of the food entry" }
      },
      required: ["food_id"]
    },
    endpoint: "/gpt-food/{food_id}/consume",
    method: "PUT",
    scopes: ["write:food"]
  },
  {
    name: "mark_all_consumed",
    description: "Mark all of today's food entries as consumed",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-food/bulk-consume",
    method: "POST",
    scopes: ["write:food"]
  },
  {
    name: "clear_todays_food",
    description: "Delete all food entries for today",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-food/today",
    method: "DELETE",
    scopes: ["write:food"]
  },
  {
    name: "get_food_history",
    description: "Get food history for the past N days",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Number of days to look back (default: 7)" },
        limit: { type: "number", description: "Maximum entries to return (default: 50)" }
      },
      required: []
    },
    endpoint: "/gpt-food/history",
    method: "GET",
    scopes: ["read:food"]
  },
  {
    name: "get_calorie_totals",
    description: "Get total calories and macros for a specific date",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format (default: today)" }
      },
      required: []
    },
    endpoint: "/gpt-food/totals",
    method: "GET",
    scopes: ["read:food"]
  },
  {
    name: "search_food",
    description: "Search food entries by name",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term (e.g., 'chicken', 'salad')" }
      },
      required: ["query"]
    },
    endpoint: "/gpt-food/search",
    method: "GET",
    scopes: ["read:food"]
  },

  // =====================================
  // PROFILE TOOLS (16)
  // =====================================
  {
    name: "get_profile",
    description: "Get user's complete profile including weight, height, age, gender, goals, and BMI",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile",
    method: "GET",
    scopes: ["read:profile"]
  },
  {
    name: "get_current_weight",
    description: "Get user's current weight",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile/weight/current",
    method: "GET",
    scopes: ["read:profile"]
  },
  {
    name: "update_weight",
    description: "Update current weight (also logs a weight entry)",
    inputSchema: {
      type: "object",
      properties: {
        weight: { type: "number", description: "Weight in kg or lbs (depends on user's units)" }
      },
      required: ["weight"]
    },
    endpoint: "/gpt-profile/weight/current",
    method: "PUT",
    scopes: ["write:profile"]
  },
  {
    name: "get_target_weight",
    description: "Get user's target weight goal",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile/weight/target",
    method: "GET",
    scopes: ["read:profile"]
  },
  {
    name: "set_target_weight",
    description: "Set target weight goal",
    inputSchema: {
      type: "object",
      properties: {
        target_weight: { type: "number", description: "Target weight in kg or lbs" }
      },
      required: ["target_weight"]
    },
    endpoint: "/gpt-profile/weight/target",
    method: "PUT",
    scopes: ["write:profile"]
  },
  {
    name: "get_weight_history",
    description: "Get weight history entries",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of entries to return (default: 30)" }
      },
      required: []
    },
    endpoint: "/gpt-profile/weight/history",
    method: "GET",
    scopes: ["read:profile"]
  },
  {
    name: "get_weight_progress",
    description: "Use this when the user asks about weight loss progress, how much weight they've lost, distance to goal weight, or weight journey. Returns starting weight, current weight, target weight, and percentage of goal completed. Includes a visual chart of weight history.",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile/weight/progress",
    method: "GET",
    scopes: ["read:profile"],
    component: "ui://widget/weight-progress.html",
    readOnlyHint: true
  },
  {
    name: "get_bmi",
    description: "Calculate and get user's BMI with category",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile/bmi",
    method: "GET",
    scopes: ["read:profile"]
  },
  {
    name: "update_height",
    description: "Update user's height",
    inputSchema: {
      type: "object",
      properties: {
        height: { type: "number", description: "Height in cm or inches" }
      },
      required: ["height"]
    },
    endpoint: "/gpt-profile/height",
    method: "PUT",
    scopes: ["write:profile"]
  },
  {
    name: "update_age",
    description: "Update user's age",
    inputSchema: {
      type: "object",
      properties: {
        age: { type: "number", description: "Age in years" }
      },
      required: ["age"]
    },
    endpoint: "/gpt-profile/age",
    method: "PUT",
    scopes: ["write:profile"]
  },
  {
    name: "update_calorie_goal",
    description: "Set daily calorie goal",
    inputSchema: {
      type: "object",
      properties: {
        calories_goal: { type: "number", description: "Daily calorie goal (kcal)" }
      },
      required: ["calories_goal"]
    },
    endpoint: "/gpt-profile/calories-goal",
    method: "PUT",
    scopes: ["write:profile"]
  },
  {
    name: "get_calorie_goal",
    description: "Get daily calorie goal",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-profile/calories-goal",
    method: "GET",
    scopes: ["read:profile"]
  },

  // =====================================
  // GOALS & MOTIVATORS TOOLS (12)
  // =====================================
  {
    name: "get_goals",
    description: "Use this when the user asks to see their goals, what they're working toward, or their goal progress. Returns all goals (both active and completed) with progress tracking. Use this for general goal review.",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-goals-motivators/goals",
    method: "GET",
    scopes: ["read:goals"],
    component: "ui://widget/goals-dashboard.html",
    readOnlyHint: true
  },
  {
    name: "get_active_goals",
    description: "Use this when the user asks specifically about current goals, ongoing goals, or what they're currently working on. Returns only active (not completed) goals. Prefer this over get_goals when user wants to focus on incomplete tasks.",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-goals-motivators/goals/active",
    method: "GET",
    scopes: ["read:goals"],
    component: "ui://widget/goals-dashboard.html",
    readOnlyHint: true
  },
  {
    name: "create_goal",
    description: "Create a new goal",
    inputSchema: {
      type: "object",
      properties: {
        goal: { type: "string", description: "Goal text (e.g., 'Lose 5kg', 'Complete 30-day streak')" },
        goal_type: { type: "string", description: "Goal type: weight, fasting, health, custom (default: custom)" }
      },
      required: ["goal"]
    },
    endpoint: "/gpt-goals-motivators/goals",
    method: "POST",
    scopes: ["write:goals"]
  },
  {
    name: "complete_goal",
    description: "Mark a goal as complete",
    inputSchema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "UUID of the goal" }
      },
      required: ["goal_id"]
    },
    endpoint: "/gpt-goals-motivators/goals/{goal_id}/complete",
    method: "PUT",
    scopes: ["write:goals"]
  },
  {
    name: "delete_goal",
    description: "Delete a goal",
    inputSchema: {
      type: "object",
      properties: {
        goal_id: { type: "string", description: "UUID of the goal to delete" }
      },
      required: ["goal_id"]
    },
    endpoint: "/gpt-goals-motivators/goals/{goal_id}",
    method: "DELETE",
    scopes: ["write:goals"]
  },
  {
    name: "get_motivators",
    description: "Get all user motivators (reasons for weight loss journey)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-goals-motivators/motivators",
    method: "GET",
    scopes: ["read:goals"]
  },
  {
    name: "create_motivator",
    description: "Create a new motivator",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Motivator text (e.g., 'Fit into wedding dress', 'Play with my kids')" },
        image_url: { type: "string", description: "Optional image URL" }
      },
      required: ["text"]
    },
    endpoint: "/gpt-goals-motivators/motivators",
    method: "POST",
    scopes: ["write:goals"]
  },
  {
    name: "delete_motivator",
    description: "Delete a motivator",
    inputSchema: {
      type: "object",
      properties: {
        motivator_id: { type: "string", description: "UUID of the motivator to delete" }
      },
      required: ["motivator_id"]
    },
    endpoint: "/gpt-goals-motivators/motivators/{motivator_id}",
    method: "DELETE",
    scopes: ["write:goals"]
  },

  // =====================================
  // ACTIVITY TOOLS (10)
  // =====================================
  {
    name: "get_current_walk",
    description: "Get current active walking session",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-activity/walking/current",
    method: "GET",
    scopes: ["read:activity"],
    component: "ui://widget/activity-tracker.html"
  },
  {
    name: "start_walk",
    description: "Start a walking session",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-activity/walking/start",
    method: "POST",
    scopes: ["write:activity"]
  },
  {
    name: "stop_walk",
    description: "Stop the current walking session",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-activity/walking/stop",
    method: "POST",
    scopes: ["write:activity"]
  },
  {
    name: "get_todays_walks",
    description: "Get all completed walks for today",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-activity/walking/today",
    method: "GET",
    scopes: ["read:activity"],
    component: "ui://widget/activity-tracker.html"
  },
  {
    name: "log_activity",
    description: "Log manual activity (gym, cardio, etc.) with duration and calories",
    inputSchema: {
      type: "object",
      properties: {
        activity_name: { type: "string", description: "Activity name (e.g., 'Gym', 'Running', 'Cycling')" },
        duration_minutes: { type: "number", description: "Duration in minutes" },
        calories_burned: { type: "number", description: "Calories burned" }
      },
      required: ["activity_name", "duration_minutes", "calories_burned"]
    },
    endpoint: "/gpt-activity/manual",
    method: "POST",
    scopes: ["write:activity"]
  },
  {
    name: "delete_activity",
    description: "Delete a manual activity entry",
    inputSchema: {
      type: "object",
      properties: {
        activity_id: { type: "string", description: "UUID of the activity to delete" }
      },
      required: ["activity_id"]
    },
    endpoint: "/gpt-activity/{activity_id}",
    method: "DELETE",
    scopes: ["write:activity"]
  },

  // =====================================
  // STATS TOOLS (8)
  // =====================================
  {
    name: "get_todays_summary",
    description: "Get today's complete summary (food, calories burned, net calories, active fast)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/today",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_weekly_summary",
    description: "Get this week's summary (fasts completed, total hours, calories in/out, deficit)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/week",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_monthly_summary",
    description: "Get this month's summary with weight change and walking distance",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/month",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_calorie_deficit",
    description: "Get today's calorie deficit (goal, consumed, burned, remaining)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/deficit",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_macros_breakdown",
    description: "Get today's macros breakdown (carbs/protein/fat percentages)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/macros",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_progress_trends",
    description: "Get 30-day progress trends (avg fast duration, weight trend)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/trends",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_fasting_insights",
    description: "Get detailed fasting insights (success rate, longest fast, avg duration)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/fasting",
    method: "GET",
    scopes: ["read:stats"]
  },
  {
    name: "get_overall_progress",
    description: "Get overall progress since joining (days active, total fasts, weight lost)",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-stats/overall",
    method: "GET",
    scopes: ["read:stats"],
    component: "ui://widget/stats-summary.html"
  },

  // =====================================
  // JOURNEY TOOLS (10) - 90-day challenge
  // =====================================
  {
    name: "get_current_journey",
    description: "Get current active 90-day journey",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/current",
    method: "GET",
    scopes: ["read:journey"],
    component: "ui://widget/journey-tracker.html"
  },
  {
    name: "get_journey_day",
    description: "Get current day number in 90-day journey",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/day",
    method: "GET",
    scopes: ["read:journey"],
    component: "ui://widget/journey-tracker.html"
  },
  {
    name: "start_journey",
    description: "Start a new 90-day challenge",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/start",
    method: "POST",
    scopes: ["write:journey"]
  },
  {
    name: "close_journey_day",
    description: "Close the current day in the 90-day journey",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/close-day",
    method: "POST",
    scopes: ["write:journey"]
  },
  {
    name: "add_daily_review",
    description: "Add a daily review for the journey (mood, energy, notes)",
    inputSchema: {
      type: "object",
      properties: {
        review_text: { type: "string", description: "Review text/notes for the day" },
        mood: { type: "string", description: "Mood: great, good, okay, bad" },
        energy_level: { type: "number", description: "Energy level 1-5" }
      },
      required: []
    },
    endpoint: "/gpt-journey/daily-review",
    method: "POST",
    scopes: ["write:journey"]
  },
  {
    name: "get_fat_burn_balance",
    description: "Get cumulative fat burn balance for the journey",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/balance",
    method: "GET",
    scopes: ["read:journey"]
  },
  {
    name: "get_journey_history",
    description: "Get past journeys",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-journey/history",
    method: "GET",
    scopes: ["read:journey"]
  },

  // =====================================
  // SETTINGS TOOLS (12)
  // =====================================
  {
    name: "get_all_settings",
    description: "Get all user settings",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-settings",
    method: "GET",
    scopes: ["read:settings"],
    component: "ui://widget/settings-panel.html"
  },
  {
    name: "set_theme",
    description: "Set app theme (light or dark)",
    inputSchema: {
      type: "object",
      properties: {
        theme: { type: "string", description: "Theme: light or dark" }
      },
      required: ["theme"]
    },
    endpoint: "/gpt-settings/theme",
    method: "PUT",
    scopes: ["write:settings"]
  },
  {
    name: "set_fasting_mode",
    description: "Set fasting mode preference (extended or intermittent)",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", description: "Mode: extended or intermittent" }
      },
      required: ["mode"]
    },
    endpoint: "/gpt-settings/fasting-mode",
    method: "PUT",
    scopes: ["write:settings"]
  },
  {
    name: "set_default_fast_duration",
    description: "Set default fast duration (1-72 hours)",
    inputSchema: {
      type: "object",
      properties: {
        hours: { type: "number", description: "Default fast duration in hours (1-72)" }
      },
      required: ["hours"]
    },
    endpoint: "/gpt-settings/default-fast-duration",
    method: "PUT",
    scopes: ["write:settings"]
  },
  {
    name: "enable_protein_tracking",
    description: "Enable or disable protein/fat tracking",
    inputSchema: {
      type: "object",
      properties: {
        enabled: { type: "boolean", description: "Enable protein/fat tracking" }
      },
      required: ["enabled"]
    },
    endpoint: "/gpt-settings/show-protein-fat",
    method: "PUT",
    scopes: ["write:settings"]
  },
  {
    name: "set_units",
    description: "Set measurement units (metric or imperial)",
    inputSchema: {
      type: "object",
      properties: {
        units: { type: "string", description: "Units: metric or imperial" }
      },
      required: ["units"]
    },
    endpoint: "/gpt-profile/units",
    method: "PUT",
    scopes: ["write:profile"]
  },

  // =====================================
  // TEMPLATES TOOLS (6)
  // =====================================
  {
    name: "get_meal_templates",
    description: "Get all saved meal templates",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-templates",
    method: "GET",
    scopes: ["read:food"]
  },
  {
    name: "save_today_as_template",
    description: "Save today's food entries as a reusable template",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Template name (e.g., 'Typical Monday', 'Low Carb Day')" }
      },
      required: ["name"]
    },
    endpoint: "/gpt-templates",
    method: "POST",
    scopes: ["write:food"]
  },
  {
    name: "apply_meal_template",
    description: "Apply a saved template to today (adds all foods)",
    inputSchema: {
      type: "object",
      properties: {
        template_id: { type: "string", description: "UUID of the template to apply" }
      },
      required: ["template_id"]
    },
    endpoint: "/gpt-templates/apply",
    method: "POST",
    scopes: ["write:food"]
  },
  {
    name: "delete_meal_template",
    description: "Delete a meal template",
    inputSchema: {
      type: "object",
      properties: {
        template_id: { type: "string", description: "UUID of the template to delete" }
      },
      required: ["template_id"]
    },
    endpoint: "/gpt-templates/{template_id}",
    method: "DELETE",
    scopes: ["write:food"]
  },

  // =====================================
  // HISTORY & SEARCH TOOLS (8)
  // =====================================
  {
    name: "get_date_history",
    description: "Get all data for a specific date (fasting, food, walking, weight)",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" }
      },
      required: ["date"]
    },
    endpoint: "/gpt-history-search/date/{date}",
    method: "GET",
    scopes: ["read:fasting", "read:food", "read:activity"]
  },
  {
    name: "get_complete_history",
    description: "Get complete history for a date range",
    inputSchema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
        end_date: { type: "string", description: "End date (YYYY-MM-DD)" }
      },
      required: ["start_date", "end_date"]
    },
    endpoint: "/gpt-history-search/complete",
    method: "GET",
    scopes: ["read:fasting", "read:food", "read:activity"]
  },
  {
    name: "search_fasts",
    description: "Search fasting sessions (e.g., all fasts over 20 hours)",
    inputSchema: {
      type: "object",
      properties: {
        min_duration: { type: "number", description: "Minimum duration in hours" },
        status: { type: "string", description: "Status: completed, ended_early" },
        limit: { type: "number", description: "Max results (default: 50)" }
      },
      required: []
    },
    endpoint: "/gpt-history-search/search/fasts",
    method: "GET",
    scopes: ["read:fasting"]
  },
  {
    name: "export_data_json",
    description: "Export all user data as JSON",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-history-search/export/json",
    method: "GET",
    scopes: ["read:fasting", "read:food", "read:activity"]
  },
  {
    name: "get_monthly_summary_report",
    description: "Generate a detailed monthly summary report",
    inputSchema: { type: "object", properties: {}, required: [] },
    endpoint: "/gpt-history-search/export/summary",
    method: "GET",
    scopes: ["read:stats"]
  }
];

export const OAUTH_SCOPES = [
  'read:fasting',
  'write:fasting',
  'read:food',
  'write:food',
  'read:profile',
  'write:profile',
  'read:goals',
  'write:goals',
  'read:activity',
  'write:activity',
  'read:journey',
  'write:journey',
  'read:stats',
  'read:settings',
  'write:settings'
];

export const SUPABASE_FUNCTIONS_BASE_URL = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL}/functions/v1` 
  : 'https://texnkijwcygodtywgedm.supabase.co/functions/v1';

