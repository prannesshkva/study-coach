import json
import os

notebook = {
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# CSE476 CA1 Project 1: Build a Real Agent\n",
    "## Topic T30: Pomodoro Study Coach [Study]\n",
    "\n",
    "**Course Outcomes Demonstrated:**\n",
    "1. **Calls Tools (at least two)**: `start_session`, `log_session`, `set_daily_goal`, `get_daily_summary`, `suggest_break_or_session`\n",
    "2. **Multi-Step Plan-Act Loop**: Decides next steps based on tool execution results.\n",
    "3. **Persistent Memory**: Remembers sessions completed across conversation turns and persists to database.\n",
    "4. **Group of 3 Add-on**: Daily focus-time total, streak tracker, and dynamic daily goal."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Step 1: Import Core Modules and Tools\n",
    "import sys\n",
    "import os\n",
    "import json\n",
    "from datetime import datetime\n",
    "\n",
    "# Ensure backend modules can be imported\n",
    "sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..', 'backend')))\n",
    "\n",
    "from app.database import db\n",
    "from app.tools import start_session, log_session, set_daily_goal, get_daily_summary, suggest_break_or_session\n",
    "from app.agent import PomodoroAgentRunner\n",
    "\n",
    "runner = PomodoroAgentRunner()\n",
    "print(\"✅ Pomodoro Study Coach Agent Engine Initialized Successfully!\")"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "### --- Scenario 1: Setting Daily Study Goal & Starting Session ---\n",
    "The user specifies an ambition to study for 2 hours today. The agent parses the intent, invokes `set_daily_goal`, checks `get_daily_summary`, and offers to start a 25-minute study session."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
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
    "The user completes a 25-minute focus session on Operating Systems. The agent calls `log_session`, updates the daily total focus time in memory, and then calls `suggest_break_or_session` to evaluate whether a short break is needed."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
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
    "Let's simulate 3 additional completed sessions. The agent recalls the earlier turns and accumulated session count (4 sessions total, 100 minutes focus time). It autonomously decides that cognitive fatigue has set in and recommends a **20-minute Long Break** instead of a short break."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
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
    "### --- Scenario 4: Daily Goal Verification & Streak Progression ---\n",
    "The user checks their progress after logging another session to achieve their 120-minute daily goal."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": None,
   "metadata": {},
   "outputs": [],
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
  "language_info": {
   "name": "python"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}

output_path = os.path.join(os.path.dirname(__file__), "notebook", "pomodoro_agent_demo.ipynb")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print("Notebook generated successfully at", output_path)
