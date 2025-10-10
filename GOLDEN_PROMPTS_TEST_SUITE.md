# 🎯 FastNow Golden Prompts Test Suite

A comprehensive test dataset for evaluating FastNow MCP tool discovery and invocation accuracy.

---

## 📊 Test Categories

### ✅ **Direct Prompts** (Should Always Work)
User explicitly mentions FastNow features or uses exact terminology.

### 🎯 **Indirect Prompts** (Should Work with Smart Discovery)
User describes outcome without using FastNow-specific terms.

### ❌ **Negative Prompts** (Should NOT Trigger FastNow)
Cases where ChatGPT's built-in tools or other services should handle the request.

---

## 🍖 **FASTING TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 1 | "Show me my current fast" | `get_current_fast` | `{}` | Direct | ⏳ Untested |
| 2 | "How long have I been fasting?" | `get_current_fast` | `{}` | Indirect | ⏳ Untested |
| 3 | "Am I still fasting?" | `get_current_fast` | `{}` | Indirect | ⏳ Untested |
| 4 | "What's my fasting progress?" | `get_current_fast` | `{}` | Indirect | ⏳ Untested |
| 5 | "Start a 16 hour fast" | `start_fast` | `{goal_hours: 16}` | Direct | ⏳ Untested |
| 6 | "Begin my fast" | `start_fast` | `{goal_hours: 16}` | Direct | ⏳ Untested |
| 7 | "I want to fast for 18 hours" | `start_fast` | `{goal_hours: 18}` | Indirect | ⏳ Untested |
| 8 | "Let's do intermittent fasting" | `start_fast` | `{goal_hours: 16}` | Indirect | ⏳ Untested |
| 9 | "End my fast" | `end_fast` | `{}` | Direct | ⏳ Untested |
| 10 | "I'm done fasting" | `end_fast` | `{}` | Indirect | ⏳ Untested |
| 11 | "Stop my fast" | `end_fast` | `{}` | Indirect | ⏳ Untested |
| 12 | "Break my fast" | `end_fast` | `{}` | Indirect | ⏳ Untested |
| 13 | "Show my fasting history" | `get_fasting_history` | `{limit: 10}` | Direct | ⏳ Untested |
| 14 | "How many times have I fasted?" | `get_fasting_stats` | `{}` | Indirect | ⏳ Untested |
| 15 | "What are my fasting stats?" | `get_fasting_stats` | `{}` | Direct | ⏳ Untested |

---

## 🍔 **FOOD TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 16 | "What did I eat today?" | `get_todays_food` | `{}` | Indirect | ⏳ Untested |
| 17 | "Show my food log" | `get_todays_food` | `{}` | Direct | ⏳ Untested |
| 18 | "How many calories did I consume?" | `get_todays_food` | `{}` | Indirect | ⏳ Untested |
| 19 | "Show today's nutrition" | `get_todays_food` | `{}` | Indirect | ⏳ Untested |
| 20 | "Log 200g grilled chicken" | `log_food` | `{name: "grilled chicken", serving_size: 200, calories: ~165}` | Direct | ⏳ Untested |
| 21 | "I ate a salad for lunch" | `log_food` | `{name: "salad", ...}` | Indirect | ⏳ Untested |
| 22 | "Track my breakfast" | `log_food` | (requires clarification) | Indirect | ⏳ Untested |
| 23 | "Add 100 calories of yogurt" | `log_food` | `{name: "yogurt", calories: 100}` | Direct | ⏳ Untested |
| 24 | "I had 2 eggs and toast" | `log_food` | (multiple foods) | Indirect | ⏳ Untested |

---

## ⚖️ **WEIGHT TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 25 | "Show my weight progress" | `get_weight_progress` | `{}` | Direct | ⏳ Untested |
| 26 | "How much weight have I lost?" | `get_weight_progress` | `{}` | Indirect | ⏳ Untested |
| 27 | "Am I close to my goal weight?" | `get_weight_progress` | `{}` | Indirect | ⏳ Untested |
| 28 | "Log my weight at 180 lbs" | `log_weight` | `{weight: 180, unit: "lbs"}` | Direct | ⏳ Untested |
| 29 | "I weigh 82 kg now" | `log_weight` | `{weight: 82, unit: "kg"}` | Indirect | ⏳ Untested |
| 30 | "What's my BMI?" | `get_bmi` | `{}` | Direct | ⏳ Untested |

---

## 🎯 **GOALS TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 31 | "Show my goals" | `get_goals` | `{}` | Direct | ⏳ Untested |
| 32 | "What am I working toward?" | `get_active_goals` | `{}` | Indirect | ⏳ Untested |
| 33 | "What are my current goals?" | `get_active_goals` | `{}` | Indirect | ⏳ Untested |
| 34 | "Create a goal to lose 10 pounds" | `create_goal` | `{title: "Lose 10 pounds", ...}` | Direct | ⏳ Untested |
| 35 | "Mark my goal as complete" | `complete_goal` | `{goal_id: ...}` | Direct | ⏳ Untested |

---

## 📊 **STATS & JOURNEY TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 36 | "Show my overall progress" | `get_overall_progress` | `{}` | Direct | ⏳ Untested |
| 37 | "How am I doing?" | `get_overall_progress` | `{}` | Indirect | ⏳ Untested |
| 38 | "Show my 90-day journey" | `get_current_journey` | `{}` | Direct | ⏳ Untested |
| 39 | "Where am I in the challenge?" | `get_journey_day` | `{}` | Indirect | ⏳ Untested |
| 40 | "What day am I on?" | `get_journey_day` | `{}` | Indirect | ⏳ Untested |

---

## 🚶 **ACTIVITY TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 41 | "Start a walk" | `start_walk` | `{}` | Direct | ⏳ Untested |
| 42 | "I'm going for a walk" | `start_walk` | `{}` | Indirect | ⏳ Untested |
| 43 | "Stop my walk" | `stop_walk` | `{}` | Direct | ⏳ Untested |
| 44 | "Show today's walks" | `get_todays_walks` | `{}` | Direct | ⏳ Untested |
| 45 | "How active was I today?" | `get_todays_walks` | `{}` | Indirect | ⏳ Untested |

---

## ⚙️ **SETTINGS TOOLS**

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 46 | "Show my settings" | `get_all_settings` | `{}` | Direct | ⏳ Untested |
| 47 | "Change to dark mode" | `set_theme` | `{theme: "dark"}` | Direct | ⏳ Untested |
| 48 | "Use metric units" | `set_units` | `{units: "metric"}` | Direct | ⏳ Untested |

---

## ❌ **NEGATIVE PROMPTS** (Should NOT Trigger FastNow)

| # | User Prompt | Expected Tool | Expected Args | Category | Status |
|---|-------------|---------------|---------------|----------|--------|
| 49 | "What's the weather today?" | **NONE** | - | Negative | ⏳ Untested |
| 50 | "Set a reminder for 8am" | **NONE** | - | Negative | ⏳ Untested |
| 51 | "Calculate 100 * 5" | **NONE** | - | Negative | ⏳ Untested |
| 52 | "Tell me a joke" | **NONE** | - | Negative | ⏳ Untested |
| 53 | "What's the capital of France?" | **NONE** | - | Negative | ⏳ Untested |
| 54 | "Search for recipes online" | **NONE** | - | Negative | ⏳ Untested |
| 55 | "Send an email to John" | **NONE** | - | Negative | ⏳ Untested |

---

## 🧪 **How to Use This Test Suite**

### **Manual Testing (Now)**

1. **Open ChatGPT Desktop** with FastNow connected
2. **Go through each prompt** in order
3. **Record the outcome:**
   - ✅ **PASS:** Correct tool called with correct arguments
   - ❌ **FAIL:** Wrong tool called, or no tool called when expected
   - ⚠️ **PARTIAL:** Correct tool but wrong arguments
4. **Update Status column** with results
5. **Iterate on tool descriptions** for failed tests

### **Automated Testing (Future)**

```javascript
// Example test harness
const results = await runGoldenPrompts([
  { prompt: "Show my current fast", expected: "get_current_fast" },
  // ...
]);

console.log(`✅ ${results.passed}/${results.total} passed`);
console.log(`❌ ${results.failed}/${results.total} failed`);
```

---

## 📈 **Success Metrics**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Direct Prompts** | 100% pass rate | - | ⏳ Untested |
| **Indirect Prompts** | 90% pass rate | - | ⏳ Untested |
| **Negative Prompts** | 95% pass rate (no false triggers) | - | ⏳ Untested |
| **Overall Coverage** | 80+ prompts tested | 55 | 📋 Ready |

---

## 🔄 **Iteration Log**

### Version 1.0 (Initial) - 2025-01-10
- Created 55 golden prompts across 8 feature categories
- Includes direct, indirect, and negative test cases
- Ready for manual testing

### Future Versions
- Add results from manual testing
- Iterate on tool descriptions based on failures
- Expand to 100+ prompts as new patterns emerge
- Build automated test harness

---

## 📝 **Testing Template**

When testing, record results like this:

```markdown
### Test #1: "Show me my current fast"
- **Expected:** get_current_fast with {}
- **Actual:** get_current_fast with {}
- **Result:** ✅ PASS
- **Notes:** Worked perfectly on first try

### Test #2: "How long have I been fasting?"
- **Expected:** get_current_fast with {}
- **Actual:** get_fasting_stats with {period: "all"}
- **Result:** ❌ FAIL
- **Notes:** Model confused "how long" (duration) with "how many times" (count)
- **Action:** Update get_current_fast description to emphasize "elapsed time" use case
```

---

## 🚀 **Next Steps**

1. ✅ **Test prompts 1-10** (Core fasting features)
2. ✅ **Test prompts 16-24** (Food logging)
3. ✅ **Test prompts 25-30** (Weight tracking)
4. ✅ **Test prompts 49-55** (Negative cases - critical!)
5. ✅ **Iterate on descriptions** for any failures
6. ✅ **Re-test failed prompts** after updates
7. ✅ **Document final pass rate** in README

---

**This test suite is a living document. Update it as you discover new user patterns!** 📊

