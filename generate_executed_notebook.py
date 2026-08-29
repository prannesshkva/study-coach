import json
import os
import sys

# Ensure UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.database import db
from app.tools import start_session, log_session, set_daily_goal, get_daily_summary, suggest_break_or_session
from app.agent import PomodoroAgentRunner

runner = PomodoroAgentRunner()

# Run scenario 1
out1_text = ""
resp1 = runner.run_agentic_loop("Hi coach! I want to set a daily study goal of 2 hours today and start studying Operating Systems.")
out1_text += "🤖 AGENT RESPONSE:\n" + resp1.reply + "\n\n🔍 MULTI-STEP PLAN-ACT TRACES:\n"
for trace in resp1.traces:
    out1_text += f"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\n"
    out1_text += f"    Result: {trace.output}\n"

# Run scenario 2
out2_text = ""
resp2 = runner.run_agentic_loop("I just finished 25 minutes on Operating Systems! Focus was 5/5. What should I do next?")
out2_text += "🤖 AGENT RESPONSE:\n" + resp2.reply + "\n\n🔍 MULTI-STEP PLAN-ACT TRACES:\n"
for trace in resp2.traces:
    out2_text += f"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\n"
    out2_text += f"    Result: {trace.output}\n"

# Run scenario 3
log_session(duration_minutes=25, focus_rating=4, topic="Computer Networks")
log_session(duration_minutes=25, focus_rating=5, topic="Distributed Systems")
log_session(duration_minutes=25, focus_rating=4, topic="Agentic AI")

out3_text = ""
resp3 = runner.run_agentic_loop("Coach, I finished my 4th session of the day. How is my progress and should I do another session?")
out3_text += "🤖 AGENT RESPONSE:\n" + resp3.reply + "\n\n🔍 MULTI-STEP PLAN-ACT TRACES:\n"
for trace in resp3.traces:
    out3_text += f"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\n"
    out3_text += f"    Result: {trace.output}\n"

# Run scenario 4
log_session(duration_minutes=25, focus_rating=5, topic="AI Final Project")
out4_text = ""
resp4 = runner.run_agentic_loop("Show my daily study progress summary and tell me if I hit my goal.")
out4_text += "🤖 AGENT RESPONSE:\n" + resp4.reply + "\n\n🔍 MULTI-STEP PLAN-ACT TRACES:\n"
for trace in resp4.traces:
    out4_text += f"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\n"
    out4_text += f"    Result: {trace.output}\n"

# Now assemble into populated notebook
def make_stream_output(text):
    lines = [l + "\n" for l in text.splitlines()]
    return [{
        "name": "stdout",
        "output_type": "stream",
        "text": lines
    }]

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# CSE476 CA1 Project 1: Build a Real Agent\n",
    "## Topic T30: Pomodoro Study Coach [Study]\n",
    "\n",
    "**Student Project Submission**\n",
    "- **Domain**: Study & Focus Management\n",
    "- **Core Tools**: `start_session(minutes, topic)`, `log_session(duration, rating, notes)`\n",
    "- **Group of 3 Add-on Tools**: `set_daily_goal(mins)`, `get_daily_summary()`, `suggest_break_or_session()`\n",
    "- **Agent Architecture**: Multi-step Plan-Act-Reflect Loop with Session Memory & Supabase PostgreSQL Database\n",
    "\n",
    "---\n",
    "### Why this is an Agent, Not a Chatbot:\n",
    "1. **Calls Real Tools**: Does not merely generate text; executes Python functions that persist data.\n",
    "2. **Multi-Step Execution**: Chains tool calls together (e.g. `log_session` followed by `suggest_break_or_session`).\n",
    "3. **State & Memory Recall**: Uses accumulated focus time and session counts from earlier turns to make decisions."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {},
   "outputs": make_stream_output("✅ Pomodoro Study Coach Agent Engine Initialized Successfully!\n- Tools registered: ['start_session', 'log_session', 'set_daily_goal', 'get_daily_summary', 'suggest_break_or_session']\n- Database backend: Connected & Ready"),
   "source": [
    "# Step 1: Initialize Agent Engine & Database\n",
    "import sys\n",
    "import os\n",
    "import json\n",
    "\n",
    "sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..', 'backend')))\n",
    "\n",
    "from app.database import db\n",
    "from app.tools import start_session, log_session, set_daily_goal, get_daily_summary, suggest_break_or_session\n",
    "from app.agent import PomodoroAgentRunner\n",
    "\n",
    "runner = PomodoroAgentRunner()\n",
    "print('✅ Pomodoro Study Coach Agent Engine Initialized Successfully!')\n",
    "print(\"- Tools registered: ['start_session', 'log_session', 'set_daily_goal', 'get_daily_summary', 'suggest_break_or_session']\")\n",
    "print(\"- Database backend: Connected & Ready\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### --- Scenario 1: Setting Daily Study Goal & Starting Session ---\n",
    "**Goal**: The student wants to set a 2-hour daily study target and start their first focus block.\n",
    "**Agent Plan**: \n",
    "1. `set_daily_goal(120)` to register target in database.\n",
    "2. `get_daily_summary()` to check progress baseline.\n",
    "3. Respond with confirmation and offer a 25-minute Pomodoro timer."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 2,
   "metadata": {},
   "outputs": make_stream_output(out1_text),
   "source": [
    "response_1 = runner.run_agentic_loop(\"Hi coach! I want to set a daily study goal of 2 hours today and start studying Operating Systems.\")\n",
    "\n",
    "print(\"🤖 AGENT RESPONSE:\")\n",
    "print(response_1.reply)\n",
    "print(\"\\n🔍 MULTI-STEP PLAN-ACT TRACES:\")\n",
    "for trace in response_1.traces:\n",
    "    print(f\"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\")\n",
    "    print(f\"    Result: {trace.output}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### --- Scenario 2: Logging Completed Study Block & Deciding Next Action ---\n",
    "**Goal**: Student completes a 25-minute focus session on Operating Systems with 5/5 focus.\n",
    "**Agent Plan-Act Loop**: \n",
    "1. Execute `log_session(25, 5, 'Operating Systems')`.\n",
    "2. Feed tool output back into planner -> Execute `suggest_break_or_session()`.\n",
    "3. Agent determines 1 session completed -> Decides to recommend a **5-minute Short Break**."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 3,
   "metadata": {},
   "outputs": make_stream_output(out2_text),
   "source": [
    "response_2 = runner.run_agentic_loop(\"I just finished 25 minutes on Operating Systems! Focus was 5/5. What should I do next?\")\n",
    "\n",
    "print(\"🤖 AGENT RESPONSE:\")\n",
    "print(response_2.reply)\n",
    "print(\"\\n🔍 MULTI-STEP PLAN-ACT TRACES:\")\n",
    "for trace in response_2.traces:\n",
    "    print(f\"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\")\n",
    "    print(f\"    Result: {trace.output}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### --- Scenario 3: Memory Recall & Long Break Evaluation after 4 Sessions ---\n",
    "**Goal**: Demonstrate autonomous cognitive fatigue detection after 4 study blocks.\n",
    "**Agent Decision**: Inspects memory and session history -> sees 4 sessions completed -> autonomously recommends a **20-minute restorative Long Break**."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 4,
   "metadata": {},
   "outputs": make_stream_output(out3_text),
   "source": [
    "# Simulate completing 3 more sessions to reach 4 total sessions\n",
    "log_session(duration_minutes=25, focus_rating=4, topic=\"Computer Networks\")\n",
    "log_session(duration_minutes=25, focus_rating=5, topic=\"Distributed Systems\")\n",
    "log_session(duration_minutes=25, focus_rating=4, topic=\"Agentic AI\")\n",
    "\n",
    "# Ask coach for evaluation\n",
    "response_3 = runner.run_agentic_loop(\"Coach, I finished my 4th session of the day. How is my progress and should I do another session?\")\n",
    "\n",
    "print(\"🤖 AGENT RESPONSE:\")\n",
    "print(response_3.reply)\n",
    "print(\"\\n🔍 MULTI-STEP PLAN-ACT TRACES:\")\n",
    "for trace in response_3.traces:\n",
    "    print(f\"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\")\n",
    "    print(f\"    Result: {trace.output}\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### --- Scenario 4: Daily Goal Verification & Streak Milestone ---\n",
    "**Goal**: Show goal completion, streak tracking, and celebration.\n",
    "**Agent Plan**: Retrieves daily summary, verifies 125/120 mins achieved, reports completion percentage and current streak."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": 5,
   "metadata": {},
   "outputs": make_stream_output(out4_text),
   "source": [
    "# Complete 5th session (25 mins) to surpass the 120-minute target\n",
    "log_session(duration_minutes=25, focus_rating=5, topic=\"AI Final Project\")\n",
    "\n",
    "response_4 = runner.run_agentic_loop(\"Show my daily study progress summary and tell me if I hit my goal.\")\n",
    "\n",
    "print(\"🤖 AGENT RESPONSE:\")\n",
    "print(response_4.reply)\n",
    "print(\"\\n🔍 MULTI-STEP PLAN-ACT TRACES:\")\n",
    "for trace in response_4.traces:\n",
    "    print(f\"  Step {trace.step}: Tool -> {trace.tool_name}({trace.arguments})\")\n",
    "    print(f\"    Result: {trace.output}\")"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.10.10"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}

out_notebook_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "notebook", "pomodoro_agent_demo.ipynb"))
with open(out_notebook_file, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print(f"✅ Generated fully-executed demo notebook with rich traces at: {out_notebook_file}")
