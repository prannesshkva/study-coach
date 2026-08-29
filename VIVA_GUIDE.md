# Viva Cheat Sheet & Architecture Guide (10 Marks)
## CSE476 CA1 Project: Topic T30 — Pomodoro Study Coach

This guide prepares you to answer every potential question in the Viva examination by referencing exact files and code locations.

---

### 1. Where does the Plan-Act loop decide the next step?
* **File**: `backend/app/agent.py` -> Method: `run_agentic_loop()` and `_run_with_openai()` / `_run_agentic_heuristics()`.
* **Explanation**: 
  1. **Plan**: When a user inputs a query (e.g., "I finished 25 mins on AI"), the agent inspects the prompt, past memory context, and determines that it must first call `log_session`.
  2. **Act**: The tool `log_session` is executed, saving the record into the database and returning structured metrics (total mins, count = 1).
  3. **Reflect & Chain**: Instead of stopping, the agent feeds the tool result back into the loop and invokes `suggest_break_or_session()` to evaluate cognitive fatigue.
  4. **Decide**: The tool returns that 1 session is complete, so the agent decides to recommend a **5-minute Short Break** (or a **20-minute Long Break** if session count is 4).
  5. **Respond**: The agent crafts the final guidance combining the logged confirmation and break timer recommendation.

---

### 2. Walk through a Tool Call step-by-step
* **File**: `backend/app/tools.py` -> Function: `log_session(duration_minutes, focus_rating, notes, topic)`
* **Explanation**:
  1. The LLM / Agent issues a function call with JSON parameters: `{"duration_minutes": 25, "focus_rating": 5, "topic": "Operating Systems"}`.
  2. `log_session` validates the parameters (clamping focus rating between 1 and 5).
  3. It calls `db.save_session()`, which persists the record in Supabase PostgreSQL (or local SQLite).
  4. It queries `db.get_daily_summary()` to re-aggregate total focus minutes, sessions count, goal status, and streak.
  5. Returns a JSON string output containing the updated state back to the agent for downstream reasoning.

---

### 3. Where is Memory read back and utilized?
* **Files**: 
  - `backend/app/database.py` -> `get_memory()` & `get_daily_summary()`
  - `backend/app/agent.py` -> `SYSTEM_PROMPT` dynamic context injection
* **Explanation**:
  - **Short-Term Conversational Memory**: `db.get_memory(session_id, limit=10)` pulls the last 10 turns (both user prompts and assistant tool executions) so the agent maintains multi-turn context.
  - **Long-Term State Memory**: `db.get_daily_summary()` computes `completed_minutes`, `target_minutes`, `sessions_count`, and `streak_days`. This state is injected into the system prompt before every agent execution so the agent always knows whether the student is on session 1, 2, 3, or 4 and how close they are to their daily target.

---

### 4. Group of 3 Add-on: Daily Focus-Time Total & Goal
* **Files**: `backend/app/tools.py` (`set_daily_goal`, `get_daily_summary`) and `frontend/src/components/GoalTracker.jsx`.
* **Explanation**:
  - Allows the student to configure dynamic daily study targets (e.g. 120 mins).
  - Tracks cumulative focus time across multiple sessions.
  - Computes completion percentage and persistent multi-day study streaks.

---

### 5. Quick Viva Q&A Cheat Sheet
| Viva Question | Concise Answer |
|---|---|
| *Why is this an Agent, not a Chatbot?* | A chatbot merely gives static text responses ("good job"). Our agent takes action using tools (`start_session`, `log_session`), maintains multi-step plan-act traces, and autonomously decides when to trigger 5-minute vs 20-minute rest intervals based on session count history. |
| *What database is used?* | Supabase PostgreSQL for cloud persistence with automatic table schemas and Row Level Security, alongside a local SQLite fallback for seamless offline execution. |
| *How are tool schemas passed to OpenAI?* | We define standard JSON Schema specifications in `TOOL_DEFINITIONS` in `backend/app/tools.py` compatible with the OpenAI Agents SDK / Tools API. |
| *Where can we see the proof of multi-step execution?* | In `notebook/pomodoro_agent_demo.ipynb` and on the web UI's "Agentic Plan-Act Trace" visualizer badge. |
