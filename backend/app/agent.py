import os
import sys
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from agents import Agent, Runner, OpenAIChatCompletionsModel, function_tool, handoff, handoffs, set_tracing_disabled
from openai import AsyncOpenAI, OpenAI

from app.database import db
from app.models import ToolCallTrace, AgentChatResponse
import app.tools as tool_funcs

set_tracing_disabled(True)
logger = logging.getLogger("pomodoro_agent")

SYSTEM_PROMPT = """You are the Study Coach, an intelligent and disciplined study mentor.
Your primary role is to run focused study sessions, track focus time, maintain the student's daily goal, and actively decide when to suggest breaks or new study blocks.

Core Behavioral Principles:
1. YOU ARE AN AGENT, NOT A PASSIVE CHATBOT: You do not just give textual answers—you take action using your tools.
2. PLAN-ACT LOOP:
   - When the student shares study activity, start by logging it with `log_session`.
   - Always follow up by calling `suggest_break_or_session` to evaluate fatigue and determine if a 5-min short break, a 20-min long break, or another session is appropriate.
   - When the student sets or asks about goals, call `set_daily_goal` or `get_daily_summary`.
   - When the student is ready to study, call `start_session(minutes, topic)`.
3. MEMORY UTILIZATION: Always acknowledge prior sessions completed today, total time logged, remaining time toward the daily goal, and current streak.
4. TONE: Motivating, structured, and focused on deep work and avoiding cognitive burnout.
"""

@function_tool
def start_session(minutes: int = 25, topic: str = "General Study") -> str:
    """Start a timed Pomodoro focus study block with duration in minutes and topic name."""
    return tool_funcs.start_session(minutes=minutes, topic=topic)

@function_tool
def log_session(duration_minutes: int = 25, focus_rating: int = 4, notes: str = "", topic: str = "General Study") -> str:
    """Log a completed study session with duration, focus rating (1-5), notes, and topic."""
    return tool_funcs.log_session(duration_minutes=duration_minutes, focus_rating=focus_rating, notes=notes, topic=topic)

@function_tool
def set_daily_goal(goal_minutes: int = 120) -> str:
    """Set the user's daily study goal in total minutes (e.g., 120 for 2 hours)."""
    return tool_funcs.set_daily_goal(goal_minutes=goal_minutes)

@function_tool
def get_daily_summary(action: str = "summary") -> str:
    """Fetch the total study time, number of sessions completed today, goal progress, and streak."""
    return tool_funcs.get_daily_summary()

@function_tool
def suggest_break_or_session(action: str = "evaluate") -> str:
    """Evaluate fatigue, total sessions done, and goal progress to decide whether to suggest a 5-minute short break, a 20-minute long break, or another study session."""
    return tool_funcs.suggest_break_or_session()

@function_tool
def reset_daily_history(confirm: bool = True) -> str:
    """Reset all completed sessions, focus time counters, and goals back to 0."""
    return tool_funcs.reset_daily_history()

STUDY_COACH_TOOLS = [
    start_session,
    log_session,
    set_daily_goal,
    get_daily_summary,
    suggest_break_or_session,
    reset_daily_history
]

def build_study_coach_agent() -> Agent:
    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("OPENAI_BASE_URL", None)
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    if api_key:
        async_client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        model = OpenAIChatCompletionsModel(model=model_name, openai_client=async_client)
    else:
        model = None

    return Agent(
        name="Study Coach",
        instructions=SYSTEM_PROMPT,
        tools=STUDY_COACH_TOOLS,
        model=model
    )

study_coach_agent = build_study_coach_agent()

class PomodoroAgentRunner:
    def run_agentic_loop(self, user_message: str, session_id: str = "default-student") -> AgentChatResponse:
        import asyncio
        traces: List[ToolCallTrace] = []
        history = db.get_memory(session_id, limit=10)
        
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                res = loop.run_until_complete(self._run_with_sdk(user_message, session_id, history, traces))
                loop.close()
                return res
            except Exception as e:
                logger.error(f"OpenAI Agents SDK execution error: {e}")
                return self._run_fallback(user_message, session_id, history, traces)
        else:
            return self._run_fallback(user_message, session_id, history, traces)

    async def _run_with_sdk(self, user_message: str, session_id: str, history: List[Dict], traces: List[ToolCallTrace]) -> AgentChatResponse:
        agent = build_study_coach_agent()
        
        summary = db.get_daily_summary()
        context_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"[Current State Memory: Today is {summary['date']}. Total focus time logged today: {summary['completed_minutes']} mins. "
            f"Daily goal: {summary['target_minutes']} mins. Sessions completed: {summary['sessions_count']}. Streak: {summary['streak_days']} days.]"
        )
        agent.instructions = context_prompt

        step_counter = 1
        active_timer = None
        suggested_break = None

        text_input = user_message
        if history:
            recent_context = "\n".join([f"{m['role']}: {m['content']}" for m in history[-4:]])
            text_input = f"[Recent History]\n{recent_context}\n\nStudent: {user_message}"

        result = await Runner.run(agent, text_input)
        
        final_text = result.final_output if hasattr(result, 'final_output') else str(result)
        
        outputs_map = {}
        if hasattr(result, 'new_items'):
            for item in result.new_items:
                if type(item).__name__ == "ToolCallOutputItem":
                    cid = getattr(item, 'call_id', '')
                    outputs_map[cid] = getattr(item, 'output', '')

            for item in result.new_items:
                if type(item).__name__ == "ToolCallItem":
                    t_name = getattr(item, 'tool_name', 'tool')
                    t_args = {}
                    try:
                        if hasattr(item, 'raw_item') and hasattr(item.raw_item, 'arguments'):
                            t_args = json.loads(item.raw_item.arguments)
                    except Exception:
                        pass
                    
                    cid = getattr(item, 'call_id', '')
                    raw_out = outputs_map.get(cid, '')
                    try:
                        parsed_out = json.loads(raw_out) if isinstance(raw_out, str) else raw_out
                    except Exception:
                        parsed_out = raw_out
                        
                    traces.append(ToolCallTrace(
                        step=step_counter,
                        tool_name=str(t_name),
                        arguments=t_args if isinstance(t_args, dict) else {},
                        output=parsed_out,
                        timestamp=datetime.now().strftime("%H:%M:%S")
                    ))
                    
                    if t_name == "start_session":
                        active_timer = t_args.get("minutes", 25)
                    elif t_name == "suggest_break_or_session":
                        if isinstance(parsed_out, dict):
                            suggested_break = parsed_out.get("break_duration_minutes")
                    
                    step_counter += 1

        if not traces:
            text_lower = user_message.lower()
            if any(w in text_lower for w in ["log", "finish", "done"]):
                traces.append(ToolCallTrace(
                    step=1,
                    tool_name="log_session",
                    arguments={"duration_minutes": 25, "focus_rating": 5, "topic": "General Study"},
                    output=json.loads(tool_funcs.log_session(25, 5, "", "General Study")),
                    timestamp=datetime.now().strftime("%H:%M:%S")
                ))
                traces.append(ToolCallTrace(
                    step=2,
                    tool_name="suggest_break_or_session",
                    arguments={},
                    output=json.loads(tool_funcs.suggest_break_or_session()),
                    timestamp=datetime.now().strftime("%H:%M:%S")
                ))
            elif any(w in text_lower for w in ["start", "begin"]):
                traces.append(ToolCallTrace(
                    step=1,
                    tool_name="start_session",
                    arguments={"minutes": 25, "topic": "General Study"},
                    output=json.loads(tool_funcs.start_session(25, "General Study")),
                    timestamp=datetime.now().strftime("%H:%M:%S")
                ))
                active_timer = 25
            elif any(w in text_lower for w in ["goal", "target"]):
                traces.append(ToolCallTrace(
                    step=1,
                    tool_name="set_daily_goal",
                    arguments={"goal_minutes": 120},
                    output=json.loads(tool_funcs.set_daily_goal(120)),
                    timestamp=datetime.now().strftime("%H:%M:%S")
                ))

        db.save_memory(session_id, "user", user_message)
        db.save_memory(session_id, "assistant", final_text, [t.dict() for t in traces])
        
        latest_summary = db.get_daily_summary()
        return AgentChatResponse(
            reply=final_text,
            traces=traces,
            daily_summary=latest_summary,
            active_timer_minutes=active_timer,
            suggested_break_minutes=suggested_break
        )

    def _run_fallback(self, user_message: str, session_id: str, history: List[Dict], traces: List[ToolCallTrace]) -> AgentChatResponse:
        import re
        text = user_message.lower()
        active_timer = None
        suggested_break = None
        step = 1

        all_numbers = [int(n) for n in re.findall(r'\d+', text)]

        duration_match = re.search(r'(\d+)\s*(?:m|min|mins|minutes|minute)\b', text)
        if duration_match:
            detected_duration = int(duration_match.group(1))
        elif all_numbers:
            detected_duration = all_numbers[0]
        else:
            detected_duration = 25

        rating_match = re.search(r'(?:focus|rating)[:\s]+(\d+)|(\d+)\s*/\s*5', text)
        if rating_match:
            detected_rating = int(rating_match.group(1) or rating_match.group(2))
        elif "great" in text or "amazing" in text:
            detected_rating = 5
        elif "poor" in text or "distracted" in text:
            detected_rating = 2
        else:
            detected_rating = 4

        topic = "General Study"
        for kw in ["operating systems", "computer networks", "distributed systems", "agentic ai", "physics", "math", "calculus", "dsa", "coding", "exam", "reading", "history", "cse476"]:
            if kw in text:
                topic = kw.title()
                break
        if topic == "General Study":
            topic_match = re.search(r'(?:studying|studied|on|for)\s+([A-Za-z0-9\s]+?)(?:\s*\(|\s+focus|\s+rating|\s+with|\s*$)', text)
            if topic_match:
                extracted = topic_match.group(1).strip()
                if extracted and len(extracted) < 30 and extracted.lower() not in ["a session", "today", "now"]:
                    topic = extracted.title()
        
        if any(w in text for w in ["reset", "clear history", "clear sessions", "start over", "clear all", "reset all", "wipe"]):
            tool_res = json.loads(tool_funcs.reset_daily_history())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="reset_daily_history",
                arguments={},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            summary_res = json.loads(tool_funcs.get_daily_summary())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            reply = (
                "🧹 **Study History Cleared**: All sessions, focus minutes, and daily progress have been reset to **0**.\n\n"
                "You have a clean slate! What topic would you like to study first today?"
            )

        elif any(w in text for w in ["set goal", "set my goal", "daily goal", "target goal", "aim for", "hours goal", "mins goal", "goal of", "target of"]):
            target_mins = 120
            if "hour" in text or "hr" in text:
                if all_numbers:
                    target_mins = all_numbers[0] * 60
            elif all_numbers:
                target_mins = all_numbers[0]
                
            tool_res = json.loads(tool_funcs.set_daily_goal(goal_minutes=target_mins))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="set_daily_goal",
                arguments={"goal_minutes": target_mins},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            summary_res = json.loads(tool_funcs.get_daily_summary())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            reply = (
                f"🎯 **Daily Goal Configured**: I've set your target to **{target_mins} minutes** ({round(target_mins/60, 1)} hours).\n\n"
                f"📊 **Current Progress**: {summary_res['summary']['completed_minutes']}m completed across {summary_res['summary']['sessions_count']} session(s).\n"
                f"Would you like me to start your first {min(25, target_mins)}-minute Pomodoro session now?"
            )

        elif "break" in text and any(w in text for w in ["finished", "done", "completed", "ended", "refreshed"]):
            summary_res = json.loads(tool_funcs.get_daily_summary())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            start_res = json.loads(tool_funcs.start_session(minutes=25, topic=topic))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="start_session",
                arguments={"minutes": 25, "topic": topic},
                output=start_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            active_timer = 25

            s = summary_res["summary"]
            reply = (
                f"🔋 **Break Complete — Mental Recharge Done!**\n\n"
                f"📊 **Today's Focus Status**: {s['completed_minutes']} / {s['target_minutes']} mins ({s['sessions_count']} sessions done).\n\n"
                f"🚀 I've prepped your next **25-minute Pomodoro focus block** for **{topic}**.\n"
                f"Put away distractions and let's get back in the zone!"
            )

        elif any(w in text for w in ["log", "logged", "completed", "finished", "done with", "studied for", "just finished"]):
            duration = detected_duration
            focus_val = max(1, min(5, detected_rating))
            
            log_res = json.loads(tool_funcs.log_session(
                duration_minutes=duration,
                focus_rating=focus_val,
                notes=f"Studied {topic}",
                topic=topic
            ))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="log_session",
                arguments={"duration_minutes": duration, "focus_rating": focus_val, "topic": topic},
                output=log_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            eval_res = json.loads(tool_funcs.suggest_break_or_session())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="suggest_break_or_session",
                arguments={},
                output=eval_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            suggested_break = eval_res["break_duration_minutes"]
            
            reply = (
                f"✅ **Session Logged**: Great job finishing **{duration} minutes** on **{topic}** (Focus: {focus_val}/5)!\n\n"
                f"📊 **Daily Focus Total**: {eval_res['total_minutes_today']} / {eval_res['daily_goal_minutes']} mins logged today ({eval_res['sessions_count_today']} sessions).\n\n"
                f"🧠 **Coach Recommendation**: {eval_res['guidance']}"
            )

        elif any(w in text for w in ["start", "begin", "focus session", "let's study", "start studying", "start a session", "new session"]):
            mins = detected_duration
            start_res = json.loads(tool_funcs.start_session(minutes=mins, topic=topic))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="start_session",
                arguments={"minutes": mins, "topic": topic},
                output=start_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            active_timer = mins
            reply = (
                f"⏱️ **Focus Session Active**: Starting a **{mins}-minute** block for **{topic}**.\n\n"
                f"💡 **Tip**: {start_res['coach_tip']}\n"
                f"Progress so far today: {start_res['today_completed_so_far']} / {start_res['daily_target']}. Put away distractions and immerse yourself!"
            )

        elif any(w in text for w in ["progress", "summary", "stats", "how am i doing", "break", "what should i do"]):
            summary_res = json.loads(tool_funcs.get_daily_summary())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            eval_res = json.loads(tool_funcs.suggest_break_or_session())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="suggest_break_or_session",
                arguments={},
                output=eval_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            suggested_break = eval_res["break_duration_minutes"]
            s = summary_res["summary"]
            
            reply = (
                f"📈 **Your Daily Study Dashboard** ({s['date']}):\n"
                f"• **Total Focus Time**: {s['completed_minutes']} / {s['target_minutes']} minutes ({s['completion_percentage']}%)\n"
                f"• **Sessions Done**: {s['sessions_count']}\n"
                f"• **Current Streak**: 🔥 {s['streak_days']} day(s)\n\n"
                f"💡 **Next Step Decision**: {eval_res['guidance']}"
            )

        else:
            summary_res = json.loads(tool_funcs.get_daily_summary())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            s = summary_res["summary"]
            reply = (
                f"Hello! I am your **Study Coach** 🍅.\n\n"
                f"I help you run high-intensity focus sessions, track your daily study goal, and optimize your rest breaks.\n\n"
                f"• **Today's Focus**: {s['completed_minutes']} / {s['target_minutes']} mins ({s['sessions_count']} sessions)\n"
                f"• **Streak**: 🔥 {s['streak_days']} day(s)\n\n"
                f"Tell me: what are we studying right now, or what is your daily focus target?"
            )

        db.save_memory(session_id, "user", user_message)
        db.save_memory(session_id, "assistant", reply, [t.dict() for t in traces])
        
        latest_summary = db.get_daily_summary()
        return AgentChatResponse(
            reply=reply,
            traces=traces,
            daily_summary=latest_summary,
            active_timer_minutes=active_timer,
            suggested_break_minutes=suggested_break
        )

agent_runner = PomodoroAgentRunner()
