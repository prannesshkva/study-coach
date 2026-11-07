import os
import sys
import json
import logging
import warnings
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage, BaseMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from app.database import db
from app.models import ToolCallTrace, HandoffTrace, AgentChatResponse, LangChainMessageModel
import app.tools as tool_funcs
from app.tools import LANGCHAIN_TOOLS

warnings.filterwarnings("ignore", category=UserWarning, module="langgraph")
logger = logging.getLogger("pomodoro_agent")

# ==========================================
# TOOL SPECIALIST ROUTING MAP
# ==========================================
TOOL_SPECIALIST_MAP = {
    "generate_psychological_plan": "Cognitive Architect",
    "save_user_schedule_profile": "Cognitive Architect",
    "get_user_schedule_profile": "Cognitive Architect",
    "start_session": "Focus Specialist",
    "log_session": "Focus Specialist",
    "suggest_break_or_session": "Neuro Rest Specialist",
    "generate_performance_report": "Performance Analyst",
    "set_daily_goal": "Performance Analyst",
    "get_daily_summary": "Performance Analyst",
    "reset_daily_history": "Study Router Orchestrator"
}

# ==========================================
# LANGGRAPH REACT AGENT PROMPT
# ==========================================
STUDY_COACH_SYSTEM_PROMPT = """You are an encouraging, highly structured, and empathetic Study Coach powered by LangGraph.
You help students build productive focus habits, organize clear study roadmaps, pace their energy with breaks, and reach their daily study goals.

You coordinate 4 specialized areas of study coaching:
1. Study Planning & Routine (Cognitive Architect):
   - When a student asks for a study plan, roadmap, exam prep, or how to study a topic, call `generate_psychological_plan`.
   - ALWAYS present the study roadmap in clean, readable Markdown tables with columns: Block, Duration, What to Focus On, Action, and Mode.
   - When a student shares their daily routine (wake time, sleep time, peak focus hours, classes/work), call `save_user_schedule_profile`.
2. Focus Sessions & Timers (Focus Specialist):
   - When the student wants to start studying or set a timer, call `start_session(minutes, topic, user_id)`.
   - When the student finishes studying or logs a session, call `log_session(duration_minutes, focus_rating, notes, topic, user_id)`.
3. Breaks & Rest (Neuro Rest Specialist):
   - When the student asks if they should take a break or continue, call `suggest_break_or_session(user_id)`.
   - Provide friendly, practical break ideas (stretch, drink water, rest eyes).
4. Progress & Analytics (Performance Analyst):
   - When the student asks for their stats, progress, or report, call `generate_performance_report(user_id)` or `get_daily_summary(user_id)`.
   - When the student wants to set their daily study target, call `set_daily_goal(goal_minutes, user_id)`.

CRITICAL COMMUNICATION & PRESENTATION RULES:
- Always respond in plain, friendly, and relatable English.
- DO NOT use complex academic or scientific jargon (e.g. avoid 'circadian entrainment', 'ultradian oscillations', 'Yerkes-Dodson arousal curve', 'autonomic downregulation') unless the student explicitly asks for scientific definitions.
- NEVER show internal function calls, code blocks, parameter dictionaries, or raw JSON payloads to the user.
- Keep your advice actionable, encouraging, and clear with bold highlights and bullet points.
"""

def get_langgraph_agent(system_prompt: Optional[str] = None):
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return None
    base_url = os.getenv("OPENAI_BASE_URL", None)
    model_name = os.getenv("OPENAI_MODEL", "openai/gpt-oss-120b")
    
    llm = ChatOpenAI(
        model=model_name,
        base_url=base_url,
        api_key=api_key,
        temperature=0.2
    )
    return create_react_agent(
        model=llm,
        tools=LANGCHAIN_TOOLS,
        prompt=system_prompt or STUDY_COACH_SYSTEM_PROMPT
    )

# Backward-compatible references
study_coach_agent = None

# ==========================================
# LANGCHAIN MESSAGE SESSION MANAGEMENT LAYER
# ==========================================

class LangChainSessionMemory:
    """
    Standardized session memory manager using LangChain Core messages:
    - HumanMessage: Student inputs and commands
    - AIMessage: Assistant replies with tool traces and multi-agent metadata
    - SystemMessage: Chronobiological context, circadian profiles, and state constraints
    """
    def __init__(self, session_id: str = "default-student", user_id: str = "default-student", max_turns: int = 15):
        self.session_id = session_id
        self.user_id = user_id
        self.max_turns = max_turns
        self.messages: List[BaseMessage] = []
        self._load_memory()

    def _load_memory(self):
        recent = db.get_memory(self.session_id, user_id=self.user_id, limit=self.max_turns)
        self.messages = []
        for item in recent:
            role = item.get("role", "user")
            content = item.get("content", "")
            tool_calls = item.get("tool_calls", [])
            created_at = item.get("created_at")
            
            if role == "user":
                msg = HumanMessage(content=content, additional_kwargs={"created_at": created_at})
            elif role == "assistant":
                msg = AIMessage(content=content, additional_kwargs={"tool_calls": tool_calls, "created_at": created_at})
            elif role == "system":
                msg = SystemMessage(content=content, additional_kwargs={"created_at": created_at})
            else:
                msg = HumanMessage(content=content, additional_kwargs={"created_at": created_at})
            self.messages.append(msg)

    def add_user_message(self, content: str) -> HumanMessage:
        msg = HumanMessage(content=content, additional_kwargs={"created_at": datetime.now().isoformat()})
        self.messages.append(msg)
        db.save_memory(self.session_id, "user", content, user_id=self.user_id)
        return msg

    def add_assistant_message(self, content: str, traces: Optional[List[Dict[str, Any]]] = None, active_agent: Optional[str] = None) -> AIMessage:
        kwargs = {"tool_calls": traces or [], "created_at": datetime.now().isoformat()}
        if active_agent:
            kwargs["active_agent"] = active_agent
        msg = AIMessage(content=content, additional_kwargs=kwargs)
        self.messages.append(msg)
        db.save_memory(self.session_id, "assistant", content, traces, user_id=self.user_id)
        return msg

    def add_system_message(self, content: str) -> SystemMessage:
        msg = SystemMessage(content=content, additional_kwargs={"created_at": datetime.now().isoformat()})
        self.messages.append(msg)
        db.save_memory(self.session_id, "system", content, user_id=self.user_id)
        return msg

    def get_langchain_messages(self) -> List[BaseMessage]:
        return self.messages[-self.max_turns:]

    def get_context_window(self) -> List[BaseMessage]:
        return self.messages[-self.max_turns:]

    def get_recent_history_text(self, limit: int = 4) -> str:
        recent = self.messages[-limit:]
        if not recent:
            return ""
        lines = []
        for m in recent:
            if isinstance(m, HumanMessage):
                lines.append(f"Student ({self.user_id}): {m.content}")
            elif isinstance(m, AIMessage):
                lines.append(f"Coach: {m.content}")
            elif isinstance(m, SystemMessage):
                lines.append(f"System: {m.content}")
            else:
                lines.append(f"{getattr(m, 'type', 'message').capitalize()}: {m.content}")
        return "\n".join(lines)

    def to_models(self) -> List[LangChainMessageModel]:
        res = []
        for m in self.messages:
            m_type = "human" if isinstance(m, HumanMessage) else "ai" if isinstance(m, AIMessage) else "system"
            role = "user" if isinstance(m, HumanMessage) else "assistant" if isinstance(m, AIMessage) else "system"
            tc = m.additional_kwargs.get("tool_calls", []) if hasattr(m, 'additional_kwargs') else []
            ca = m.additional_kwargs.get("created_at") if hasattr(m, 'additional_kwargs') else None
            res.append(LangChainMessageModel(
                type=m_type,
                role=role,
                content=m.content if isinstance(m.content, str) else str(m.content),
                tool_calls=tc,
                additional_kwargs=m.additional_kwargs if hasattr(m, 'additional_kwargs') else {},
                created_at=ca
            ))
        return res

    def clear(self):
        self.messages = []
        db.clear_session_memory(self.session_id, user_id=self.user_id)

Conversation = LangChainSessionMemory


# ==========================================
# AGENT RUNNER & ORCHESTRATION ENGINE
# ==========================================

class PomodoroAgentRunner:
    def run_agentic_loop(
        self,
        user_message: str,
        session_id: str = "default-student",
        user_id: str = "default-student"
    ) -> AgentChatResponse:
        conversation = Conversation(session_id=session_id, user_id=user_id, max_turns=10)
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            try:
                return self._run_with_langgraph(user_message, conversation, user_id)
            except Exception as e:
                logger.error(f"LangGraph create_react_agent execution error: {e}")
                return self._run_fallback(user_message, conversation, [], [], user_id)
        else:
            return self._run_fallback(user_message, conversation, [], [], user_id)

    def _run_with_langgraph(
        self,
        user_message: str,
        conversation: Conversation,
        user_id: str
    ) -> AgentChatResponse:
        summary = db.get_daily_summary(user_id=user_id)
        profile = summary.get("user_profile", {})

        system_prompt = (
            f"{STUDY_COACH_SYSTEM_PROMPT}\n\n"
            f"[Active Student Context: User ID: '{user_id}'. Name: {profile.get('name', 'Student')}. "
            f"Peak Energy: {profile.get('peak_energy_window', 'morning')}. "
            f"Routine: Wakes {profile.get('wake_time', '07:00')}, Sleeps {profile.get('sleep_time', '23:00')}. "
            f"Commitments: {profile.get('fixed_commitments', 'None')}. "
            f"Today's Progress: {summary['completed_minutes']}/{summary['target_minutes']} mins, "
            f"{summary['sessions_count']} sessions, streak {summary['streak_days']} days.]"
        )

        agent_graph = get_langgraph_agent(system_prompt)
        if not agent_graph:
            raise ValueError("LangGraph agent could not be created")

        # Prepare conversational context from past turns
        recent = conversation.get_langchain_messages()
        input_messages: List[BaseMessage] = []
        for m in recent[-6:]:
            if isinstance(m, HumanMessage):
                input_messages.append(HumanMessage(content=m.content))
            elif isinstance(m, AIMessage):
                # Pass clean string content without stale tool_calls kwargs to avoid OpenAI/Groq API validation errors
                content_str = m.content if isinstance(m.content, str) else str(m.content)
                input_messages.append(AIMessage(content=content_str))

        input_messages.append(HumanMessage(content=f"[Student User ID: {user_id}]\n{user_message}"))

        result = agent_graph.invoke({"messages": input_messages})
        result_messages = result.get("messages", [])

        traces: List[ToolCallTrace] = []
        handoffs_list: List[HandoffTrace] = []
        active_timer = None
        suggested_break = None
        active_agent_name = "Study Router Orchestrator"
        step_counter = 1

        # Collect tool outputs
        tool_outputs: Dict[str, Any] = {}
        for msg in result_messages:
            if isinstance(msg, ToolMessage):
                call_id = getattr(msg, "tool_call_id", "")
                content_val = msg.content
                try:
                    tool_outputs[call_id] = json.loads(content_val) if isinstance(content_val, str) else content_val
                except Exception:
                    tool_outputs[call_id] = content_val

        plan_table_markdown = None
        perf_table_markdown = None

        for msg in result_messages:
            if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    t_name = tc.get("name", "")
                    t_args = tc.get("args", {})
                    t_id = tc.get("id", "")
                    t_out = tool_outputs.get(t_id, {})

                    spec_agent = TOOL_SPECIALIST_MAP.get(t_name, "Study Router Orchestrator")
                    active_agent_name = spec_agent

                    handoffs_list.append(HandoffTrace(
                        step=step_counter,
                        from_agent="Study Router Orchestrator",
                        to_agent=spec_agent,
                        reason=f"Delegated domain execution to {spec_agent}",
                        timestamp=datetime.now().strftime("%H:%M:%S")
                    ))

                    traces.append(ToolCallTrace(
                        step=step_counter,
                        tool_name=t_name,
                        agent_name=spec_agent,
                        arguments=t_args if isinstance(t_args, dict) else {},
                        output=t_out,
                        timestamp=datetime.now().strftime("%H:%M:%S")
                    ))
                    step_counter += 1

                    if t_name == "start_session":
                        active_timer = t_args.get("minutes", 25)
                    elif t_name == "suggest_break_or_session":
                        if isinstance(t_out, dict):
                            suggested_break = t_out.get("break_duration_minutes")
                    elif t_name == "generate_psychological_plan":
                        if isinstance(t_out, dict):
                            active_timer = t_out.get("recommended_first_timer_minutes", 25)
                            suggested_break = t_out.get("recommended_break_minutes", 5)
                            plan_table_markdown = t_out.get("study_table_markdown")
                    elif t_name == "generate_performance_report":
                        if isinstance(t_out, dict):
                            perf_table_markdown = t_out.get("analytics_table_markdown")

        # Find final text from assistant
        final_text = ""
        for msg in reversed(result_messages):
            if isinstance(msg, AIMessage) and msg.content:
                if isinstance(msg.content, str):
                    final_text = msg.content
                    break
                elif isinstance(msg.content, list):
                    parts = [p.get("text", "") if isinstance(p, dict) else str(p) for p in msg.content]
                    final_text = "\n".join(parts)
                    break

        if not final_text:
            final_text = "I've reviewed your request and updated your study schedule. Let's make today productive!"

        # Ensure that markdown tables are cleanly displayed in the output
        if plan_table_markdown and "|" in plan_table_markdown and "|" not in final_text:
            final_text = f"{final_text}\n\n### 📅 Recommended Study Schedule\n{plan_table_markdown}"
        if perf_table_markdown and "|" in perf_table_markdown and "|" not in final_text:
            final_text = f"{final_text}\n\n### 📊 Progress Analytics\n{perf_table_markdown}"

        conversation.add_user_message(user_message)
        conversation.add_assistant_message(final_text, [t.dict() for t in traces], active_agent=active_agent_name)

        latest_summary = db.get_daily_summary(user_id=user_id)
        return AgentChatResponse(
            reply=final_text,
            session_id=conversation.session_id,
            active_agent=active_agent_name,
            handoffs=handoffs_list,
            traces=traces,
            daily_summary=latest_summary,
            active_timer_minutes=active_timer,
            suggested_break_minutes=suggested_break,
            psychological_framework="LangGraph React Agent Framework",
            user_profile=latest_summary.get("user_profile")
        )

    def _run_fallback(
        self,
        user_message: str,
        conversation: Conversation,
        traces: List[ToolCallTrace],
        handoffs_list: List[HandoffTrace],
        user_id: str
    ) -> AgentChatResponse:
        import re
        text = user_message.lower()
        active_timer = None
        suggested_break = None
        step = 1
        active_agent = "Study Router Orchestrator"
        framework = "Ultradian Rhythms & Circadian Chronobiology"

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
        for kw in [
            "operating systems", "computer networks", "distributed systems", "agentic ai",
            "machine learning", "physics", "math", "calculus", "dsa", "coding",
            "algorithms", "exam", "reading", "history", "cse476", "database", "psychology",
            "system design", "compiler design", "data structures"
        ]:
            if kw in text:
                topic = kw.title()
                break
        if topic == "General Study":
            topic_match = re.search(r'(?:studying|studied|on|for|plan|master)\s+([A-Za-z0-9\s]+?)(?:\s*\(|\s+focus|\s+rating|\s+with|\s+plan|\s*$)', text)
            if topic_match:
                extracted = topic_match.group(1).strip()
                if extracted and len(extracted) < 30 and extracted.lower() not in ["a session", "today", "now", "a break", "my goal", "my schedule"]:
                    topic = extracted.title()

        user_profile = db.get_user_schedule(user_id)

        # ==========================================
        # 1. ROUTING: SCHEDULE INTAKE & PROFILE UPDATE
        # ==========================================
        if re.search(r'\b(my schedule is|i wake up at|i sleep at|my peak hours|night owl|morning person|set schedule|my routine|schedule profile|my classes are)\b', text):
            active_agent = "Cognitive Architect"
            framework = "Circadian Chronobiology & Habit Architecture"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Cognitive Architect",
                reason="Student provided schedule and routine parameters for circadian calibration",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            wake = "07:00"
            wake_m = re.search(r'(?:wake|up|morning)(?:\s+at)?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)', text)
            if wake_m:
                wake = wake_m.group(1).strip()

            sleep = "23:00"
            sleep_m = re.search(r'(?:sleep|bed|night)(?:\s+at)?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)', text)
            if sleep_m:
                sleep = sleep_m.group(1).strip()

            peak = "morning"
            if any(w in text for w in ["night owl", "night", "late night", "midnight"]):
                peak = "night"
            elif any(w in text for w in ["evening", "afternoon"]):
                peak = "evening"

            name = user_profile.get("name", "Student")
            name_m = re.search(r'(?:my name is|i am|call me)\s+([A-Za-z]+)', text)
            if name_m:
                name = name_m.group(1).title()

            commitments = user_profile.get("fixed_commitments", "")
            if "class" in text or "lecture" in text or "work" in text or "college" in text:
                commitments = "Classes / Work commitments"

            save_res = json.loads(tool_funcs.save_user_schedule_profile(
                user_id=user_id,
                name=name,
                wake_time=wake,
                sleep_time=sleep,
                peak_energy_window=peak,
                fixed_commitments=commitments,
                preferred_pomodoro_length=25
            ))

            traces.append(ToolCallTrace(
                step=step,
                tool_name="save_user_schedule_profile",
                agent_name="Cognitive Architect",
                arguments={"user_id": user_id, "name": name, "wake_time": wake, "sleep_time": sleep, "peak_energy_window": peak},
                output=save_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            p = save_res["profile"]
            reply = (
                f"👤 **Schedule Profile Saved for {name}**\n\n"
                f"I've saved your daily routine:\n\n"
                f"| Schedule Item | Your Setting | Tip |\n"
                f"| :--- | :--- | :--- |\n"
                f"| **Active Hours** | ⏰ {p['wake_time']} – 🌙 {p['sleep_time']} | Regular sleep helps memory |\n"
                f"| **Peak Energy Time** | ⚡ **{p['peak_energy_window'].title()}** | Best time for difficult topics |\n"
                f"| **Focus Block Size** | ⏱️ {p['preferred_pomodoro_length']} minutes | Standard focus interval |\n\n"
                f"💡 **Coach Tip**: Since you feel most energetic in the **{p['peak_energy_window']}**, we will schedule tricky concepts and heavy practice during that window.\n\n"
                f"What subject or topic would you like to plan first?"
            )

        # ==========================================
        # 2. ROUTING: PSYCHOLOGICAL STUDY PLANNING
        # ==========================================
        elif re.search(r'\b(plan|schedule|psychological|table|mastery|strategy|roadmap|prepare|syllabus|cognitive|how to study)\b', text):
            active_agent = "Cognitive Architect"
            framework = "Structured Study Plan & Focus Roadmap"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Cognitive Architect",
                reason="Student requested study plan and schedule roadmap",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            avail_mins = detected_duration if detected_duration > 25 else (all_numbers[0] if all_numbers and all_numbers[0] >= 30 else 90)
            difficulty = "hard" if any(w in text for w in ["hard", "difficult", "complex", "dense", "exam"]) else "moderate"
            
            plan_res_str = tool_funcs.generate_psychological_plan(
                topic=topic,
                difficulty_level=difficulty,
                available_minutes=avail_mins,
                goal=f"Master {topic}",
                user_id=user_id
            )
            plan_res = json.loads(plan_res_str)

            traces.append(ToolCallTrace(
                step=step,
                tool_name="generate_psychological_plan",
                agent_name="Cognitive Architect",
                arguments={"topic": topic, "difficulty_level": difficulty, "available_minutes": avail_mins, "goal": f"Master {topic}", "user_id": user_id},
                output=plan_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            active_timer = plan_res.get("recommended_first_timer_minutes", 25)
            suggested_break = plan_res.get("recommended_break_minutes", 5)

            reply = (
                f"🧠 **Study Plan for {topic}**\n\n"
                f"{plan_res['personalization_note']}\n\n"
                f"Here is a straightforward **{avail_mins}-minute focus & break roadmap** to help you master **{topic}** step-by-step:\n\n"
                f"### 📋 Focus & Break Roadmap\n\n"
                f"{plan_res['study_table_markdown']}\n\n"
                f"### 🔁 Review Schedule\n\n"
                f"{plan_res['spaced_repetition_table_markdown']}\n\n"
                f"{plan_res['implementation_intention']}\n\n"
                f"🚀 **Ready?** I've set up your first **{active_timer}-minute focus block** on **{topic}**. Let me know when you want to start!"
            )

        # ==========================================
        # 3. ROUTING: LOGGING COMPLETED SESSION
        # ==========================================
        elif re.search(r'\b(log|logged|completed|finished|done with|studied for|just finished)\b', text):
            active_agent = "Focus Specialist"
            framework = "Focus Habit Reinforcement"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Focus Specialist",
                reason="Record completed study session and update focus metrics",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            duration = detected_duration
            focus_val = max(1, min(5, detected_rating))
            
            log_res = json.loads(tool_funcs.log_session(
                duration_minutes=duration,
                focus_rating=focus_val,
                notes=f"Studied {topic}",
                topic=topic,
                user_id=user_id
            ))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="log_session",
                agent_name="Focus Specialist",
                arguments={"duration_minutes": duration, "focus_rating": focus_val, "topic": topic, "user_id": user_id},
                output=log_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Focus Specialist",
                to_agent="Neuro Rest Specialist",
                reason="Post-session fatigue and recovery evaluation",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            eval_res = json.loads(tool_funcs.suggest_break_or_session(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="suggest_break_or_session",
                agent_name="Neuro Rest Specialist",
                arguments={"user_id": user_id},
                output=eval_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            suggested_break = eval_res["break_duration_minutes"]
            
            reply = (
                f"✅ **Great Work!** Recorded **{duration} minutes** on **{topic}** (Flow Rating: {focus_val}/5)!\n\n"
                f"📊 **Today's Progress**: {eval_res['total_minutes_today']} / {eval_res['daily_goal_minutes']} mins completed ({eval_res['sessions_count_today']} sessions | 🔥 {log_res['streak_days']}-day streak).\n\n"
                f"### 🌿 Rest Suggestion\n"
                f"{eval_res['guidance']}\n"
                f"• **Quick Action**: {eval_res['neuro_recovery_technique']}"
            )

        # ==========================================
        # 4. ROUTING: FATIGUE & RECOVERY EVALUATION
        # ==========================================
        elif any(w in text for w in ["break", "tired", "exhausted", "fatigue", "rest", "burnout", "what next", "should i take a break"]):
            active_agent = "Neuro Rest Specialist"
            framework = "Energy Pacing & Break Optimization"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Neuro Rest Specialist",
                reason="Student evaluating fatigue and optimal rest interval",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            eval_res = json.loads(tool_funcs.suggest_break_or_session(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="suggest_break_or_session",
                agent_name="Neuro Rest Specialist",
                arguments={"user_id": user_id},
                output=eval_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            suggested_break = eval_res["break_duration_minutes"]
            reply = (
                f"🌿 **Energy & Break Check**\n\n"
                f"{eval_res['guidance']}\n\n"
                f"### 🧘 Suggested Break Activity\n"
                f"• **What to do**: {eval_res['neuro_recovery_technique']}\n"
                f"• **Break Time**: **{eval_res['break_duration_minutes']} minutes**\n"
                f"• **Today's Total**: {eval_res['total_minutes_today']} / {eval_res['daily_goal_minutes']} mins ({eval_res['sessions_count_today']} sessions)\n\n"
                f"Take this break to step away from your screen. Let me know when you're refreshed and ready for the next round!"
            )

        # ==========================================
        # 5. ROUTING: STARTING FOCUS SESSION
        # ==========================================
        elif any(w in text for w in ["start", "begin", "focus session", "let's study", "start studying", "start a session", "new session"]):
            active_agent = "Focus Specialist"
            framework = "Single-Task Focus Sprint"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Focus Specialist",
                reason="Initiate timed deep work session",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            mins = detected_duration
            start_res = json.loads(tool_funcs.start_session(minutes=mins, topic=topic, user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="start_session",
                agent_name="Focus Specialist",
                arguments={"minutes": mins, "topic": topic, "user_id": user_id},
                output=start_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            active_timer = mins
            reply = (
                f"⏱️ **Focus Block Started**: **{mins} minutes** on **{topic}**.\n\n"
                f"💡 **Tip**: {start_res['coach_tip']}\n"
                f"• **Progress**: {start_res['today_completed_so_far']} / {start_res['daily_target']} completed today.\n\n"
                f"Put away distractions, silence notifications, and dive in!"
            )

        # ==========================================
        # 6. ROUTING: PERFORMANCE & ANALYTICS
        # ==========================================
        elif any(w in text for w in ["progress", "summary", "stats", "analytics", "report", "how am i doing", "velocity", "streak"]):
            active_agent = "Performance Analyst"
            framework = "Behavioral Self-Determination & Velocity Tracking"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Performance Analyst",
                reason="Synthesize study metrics into structured analytics matrix",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            rep_res = json.loads(tool_funcs.generate_performance_report(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="generate_performance_report",
                agent_name="Performance Analyst",
                arguments={"user_id": user_id},
                output=rep_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            s = rep_res["summary"]
            reply = (
                f"📊 **Daily Focus Performance Matrix** ({s['date']})\n\n"
                f"{rep_res['analytics_table_markdown']}\n\n"
                f"🎯 **Pacing Assessment**: You have completed **{s['completed_minutes']} of {s['target_minutes']} minutes** ({s['completion_percentage']}%). "
                f"Maintaining an average focus score of **{rep_res['average_focus_rating']}/5.0**."
            )

        # ==========================================
        # 7. ROUTING: SETTING DAILY GOAL
        # ==========================================
        elif any(w in text for w in ["goal", "target", "set goal", "set my goal", "daily goal", "study goal", "aim for", "hours goal", "mins goal"]):
            active_agent = "Performance Analyst"
            framework = "Implementation Goal Calibration"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Performance Analyst",
                reason="Calibrate daily study target and time allocation",
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1

            target_mins = 120
            if "hour" in text or "hr" in text:
                if all_numbers:
                    target_mins = all_numbers[0] * 60
            elif all_numbers:
                target_mins = all_numbers[0]
                
            tool_res = json.loads(tool_funcs.set_daily_goal(goal_minutes=target_mins, user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="set_daily_goal",
                agent_name="Performance Analyst",
                arguments={"goal_minutes": target_mins, "user_id": user_id},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            
            summary_res = json.loads(tool_funcs.get_daily_summary(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                agent_name="Performance Analyst",
                arguments={"user_id": user_id},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            reply = (
                f"🎯 **Daily Target Configured**: Set to **{target_mins} minutes** ({round(target_mins/60, 1)} hours).\n\n"
                f"| Metric | Current Value |\n"
                f"| :--- | :--- |\n"
                f"| **User ID** | `{user_id}` |\n"
                f"| **Target Goal** | {target_mins} mins ({round(target_mins/60, 1)}h) |\n"
                f"| **Completed So Far** | {summary_res['summary']['completed_minutes']} mins |\n"
                f"| **Remaining** | {max(0, target_mins - summary_res['summary']['completed_minutes'])} mins |\n"
                f"| **Streak Status** | 🔥 {summary_res['summary']['streak_days']} day(s) |\n\n"
                f"Shall I initiate your first 25-minute Pomodoro block to begin making progress?"
            )

        # ==========================================
        # 8. ROUTING: RESET HISTORY
        # ==========================================
        elif any(w in text for w in ["reset", "clear history", "clear sessions", "start over", "clear all", "reset all", "wipe"]):
            active_agent = "Study Router Orchestrator"
            tool_res = json.loads(tool_funcs.reset_daily_history(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="reset_daily_history",
                agent_name="Study Router Orchestrator",
                arguments={"user_id": user_id},
                output=tool_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            step += 1
            reply = (
                f"🧹 **Workspace & Session History Cleared for `{user_id}`**\n\n"
                "All your completed sessions, focus time counters, and daily progress have been reset to **0**.\n\n"
                "You have a clean slate! What subject or topic would you like to plan or study first?"
            )

        # ==========================================
        # 9. DEFAULT GREETING / META-ORCHESTRATION & INTAKE PROMPT
        # ==========================================
        else:
            active_agent = "Study Router Orchestrator"
            summary_res = json.loads(tool_funcs.get_daily_summary(user_id=user_id))
            traces.append(ToolCallTrace(
                step=step,
                tool_name="get_daily_summary",
                agent_name="Study Router Orchestrator",
                arguments={"user_id": user_id},
                output=summary_res,
                timestamp=datetime.now().strftime("%H:%M:%S")
            ))
            
            s = summary_res["summary"]
            p = s.get("user_profile", {})
            name = p.get("name", "Student")
            
            reply = (
                f"👋 Hello **{name}**! I am your **Study Router Orchestrator** 🍅 (User: `{user_id}`).\n\n"
                f"I coordinate a team of specialized AI agents grounded in **Cognitive Psychology & Circadian Science**:\n\n"
                f"| Specialist Agent | Domain & Expertise |\n"
                f"| :--- | :--- |\n"
                f"| 🧠 **Cognitive Architect** | Psychological study plans, Circadian schedule intake, Spaced Repetition tables |\n"
                f"| ⚡ **Focus Specialist** | Pomodoro session execution, real-time timers, focus scoring |\n"
                f"| 🌿 **Neuro Rest Specialist** | Fatigue diagnostics, Physiological Sighs, NSDR recovery protocols |\n"
                f"| 📊 **Performance Analyst** | Study velocity, streak tracking, progress dashboards |\n\n"
                f"📊 **Today's Status**: {s['completed_minutes']} / {s['target_minutes']} mins ({s['sessions_count']} sessions | 🔥 {s['streak_days']}-day streak).\n\n"
                f"💡 **Personalization Intake**: Tell me about your routine (e.g. *'I wake up at 7am, sleep at 11pm, and study best in the evening'*) or tell me what topic to plan next!"
            )

        conversation.add_user_message(user_message)
        conversation.add_assistant_message(reply, [t.dict() for t in traces], active_agent=active_agent)
        
        latest_summary = db.get_daily_summary(user_id=user_id)
        return AgentChatResponse(
            reply=reply,
            session_id=conversation.session_id,
            active_agent=active_agent,
            handoffs=handoffs_list,
            traces=traces,
            daily_summary=latest_summary,
            active_timer_minutes=active_timer,
            suggested_break_minutes=suggested_break,
            psychological_framework=framework,
            user_profile=latest_summary.get("user_profile")
        )

agent_runner = PomodoroAgentRunner()


