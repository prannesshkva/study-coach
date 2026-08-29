import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.tools import TOOL_DEFINITIONS, TOOL_MAP
from app.database import db
from app.models import ToolCallTrace, AgentChatResponse

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

class PomodoroAgentRunner:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.base_url = os.getenv("OPENAI_BASE_URL", None)
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def run_agentic_loop(self, user_message: str, session_id: str = "default-student") -> AgentChatResponse:
        traces: List[ToolCallTrace] = []
        step_counter = 1
        
        history = db.get_memory(session_id, limit=10)
        
        if self.api_key:
            return self._run_with_openai(user_message, session_id, history, traces)
        else:
            return self._run_agentic_heuristics(user_message, session_id, history, traces)

    def _run_with_openai(self, user_message: str, session_id: str, history: List[Dict], traces: List[ToolCallTrace]) -> AgentChatResponse:
        from openai import OpenAI
        
        client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        summary = db.get_daily_summary()
        context_note = (
            f"[Current State Memory: Today is {summary['date']}. Total focus time logged today: {summary['completed_minutes']} mins. "
            f"Daily goal: {summary['target_minutes']} mins. Sessions completed: {summary['sessions_count']}. Streak: {summary['streak_days']} days.]"
        )
        messages.append({"role": "system", "content": context_note})
        
        for turn in history:
            messages.append({"role": turn["role"], "content": turn["content"]})
            
        messages.append({"role": "user", "content": user_message})
        
        step = 1
        max_turns = 6
        active_timer = None
        suggested_break = None

        while step <= max_turns:
            try:
                response = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto"
                )
                
                choice = response.choices[0]
                message = choice.message
                
                if message.tool_calls:
                    messages.append(message)
                    
                    for tool_call in message.tool_calls:
                        tool_name = tool_call.function.name
                        try:
                            tool_args = json.loads(tool_call.function.arguments)
                        except Exception:
                            tool_args = {}
                            
                        if tool_name in TOOL_MAP:
                            tool_fn = TOOL_MAP[tool_name]
                            tool_result_str = tool_fn(**tool_args)
                            try:
                                tool_result_obj = json.loads(tool_result_str)
                            except Exception:
                                tool_result_obj = tool_result_str
                                
                            traces.append(ToolCallTrace(
                                step=step,
                                tool_name=tool_name,
                                arguments=tool_args,
                                output=tool_result_obj,
                                timestamp=datetime.now().strftime("%H:%M:%S")
                            ))
                            
                            if tool_name == "start_session":
                                active_timer = tool_args.get("minutes", 25)
                            elif tool_name == "suggest_break_or_session":
                                if isinstance(tool_result_obj, dict):
                                    suggested_break = tool_result_obj.get("break_duration_minutes")

                            messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "name": tool_name,
                                "content": tool_result_str
                            })
                        else:
                            messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "name": tool_name,
                                "content": json.dumps({"error": f"Unknown tool {tool_name}"})
                            })
                            
                    step += 1
                else:
                    final_text = message.content or "Let's keep up the focused effort!"
                    
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
            except Exception as e:
                logger.error(f"OpenAI agent execution error: {e}")
                return self._run_agentic_heuristics(user_message, session_id, history, traces)

        latest_summary = db.get_daily_summary()
        return AgentChatResponse(
            reply="I've processed your session and updated your daily goal stats!",
            traces=traces,
            daily_summary=latest_summary
        )

    def _run_agentic_heuristics(self, user_message: str, session_id: str, history: List[Dict], traces: List[ToolCallTrace]) -> AgentChatResponse:
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
            tool_res = json.loads(TOOL_MAP["reset_daily_history"]())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="reset_daily_history",
                arguments={},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            summary_res = json.loads(TOOL_MAP["get_daily_summary"]())
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
                
            tool_res = json.loads(TOOL_MAP["set_daily_goal"](goal_minutes=target_mins))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="set_daily_goal",
                arguments={"goal_minutes": target_mins},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            summary_res = json.loads(TOOL_MAP["get_daily_summary"]())
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
            summary_res = json.loads(TOOL_MAP["get_daily_summary"]())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            start_res = json.loads(TOOL_MAP["start_session"](minutes=25, topic=topic))
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
            
            log_res = json.loads(TOOL_MAP["log_session"](
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
            
            eval_res = json.loads(TOOL_MAP["suggest_break_or_session"]())
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
            start_res = json.loads(TOOL_MAP["start_session"](minutes=mins, topic=topic))
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
            summary_res = json.loads(TOOL_MAP["get_daily_summary"]())
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                arguments={},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            eval_res = json.loads(TOOL_MAP["suggest_break_or_session"]())
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
            summary_res = json.loads(TOOL_MAP["get_daily_summary"]())
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
