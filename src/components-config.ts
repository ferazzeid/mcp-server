/**
 * Component Configuration for FastNow MCP Server
 * Maps tools to their UI components hosted on Cloudflare Pages
 */

const COMPONENTS_CDN = "https://5663f26e.fastnow-components.pages.dev";

export interface ComponentConfig {
  uri: string;
  name: string;
  description: string;
  htmlContent: string;
  csp: {
    connect_domains: string[];
    resource_domains: string[];
  };
  linkedTools: string[];
}

export const FASTNOW_COMPONENTS: ComponentConfig[] = [
  // 1. Fasting Progress Widget
  {
    uri: "ui://widget/fasting-progress.html",
    name: "Fasting Progress",
    description: "Real-time fasting timer with animated circular progress ring, pause/resume buttons, and motivational messages",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/fasting-progress.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_current_fast"]
  },

  // 2. Food Log Widget
  {
    uri: "ui://widget/food-log.html",
    name: "Food Log Dashboard",
    description: "Interactive nutrition dashboard showing today's food entries with calorie progress bar, macro breakdown, and add/delete food actions",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/food-log.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_todays_food"]
  },

  // 3. Weight Progress Widget
  {
    uri: "ui://widget/weight-progress.html",
    name: "Weight Progress Tracker",
    description: "Weight loss progress visualization with line chart, BMI display, and progress statistics from starting to target weight",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/weight-progress.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_weight_progress"]
  },

  // 4. Goals Dashboard Widget
  {
    uri: "ui://widget/goals-dashboard.html",
    name: "Goals Dashboard",
    description: "Interactive checklist showing active and completed goals with quick completion tracking",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/goals-dashboard.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_goals", "get_active_goals"]
  },

  // 5. Stats Summary Widget
  {
    uri: "ui://widget/stats-summary.html",
    name: "Stats Summary",
    description: "Overview of user progress including total fasts completed, fasting hours, and weight lost",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/stats-summary.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_fasting_stats", "get_overall_progress"]
  },

  // 6. Journey Tracker Widget
  {
    uri: "ui://widget/journey-tracker.html",
    name: "90-Day Journey Tracker",
    description: "Progress visualization for the 90-day challenge showing current day, progress percentage, and close day action",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/journey-tracker.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_current_journey", "get_journey_day"]
  },

  // 7. Activity Tracker Widget
  {
    uri: "ui://widget/activity-tracker.html",
    name: "Activity Tracker",
    description: "Display of daily activity including steps, calories burned, with quick actions to start walks or log activities",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/activity-tracker.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_current_walk", "get_todays_walks"]
  },

  // 8. Settings Panel Widget
  {
    uri: "ui://widget/settings-panel.html",
    name: "Settings Panel",
    description: "User preferences interface for theme, units, default fast duration, and protein tracking settings",
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${COMPONENTS_CDN}/style.css">
</head>
<body>
  <div id="fastnow-root"></div>
  <script type="module" src="${COMPONENTS_CDN}/settings-panel.js"></script>
</body>
</html>
    `.trim(),
    csp: {
      connect_domains: [COMPONENTS_CDN],
      resource_domains: [COMPONENTS_CDN]
    },
    linkedTools: ["get_all_settings"]
  }
];

/**
 * Get component configuration by URI
 */
export function getComponentByUri(uri: string): ComponentConfig | undefined {
  return FASTNOW_COMPONENTS.find(c => c.uri === uri);
}

/**
 * Get component URI for a tool name
 */
export function getComponentForTool(toolName: string): string | undefined {
  const component = FASTNOW_COMPONENTS.find(c => c.linkedTools.includes(toolName));
  return component?.uri;
}

/**
 * Get all component URIs
 */
export function getAllComponentUris(): string[] {
  return FASTNOW_COMPONENTS.map(c => c.uri);
}

