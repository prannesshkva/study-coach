import os
import sys
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Union

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from agents import Agent, Runner, OpenAIChatCompletionsModel, function_tool, handoff, handoffs, set_tracing_disabled
from openai import AsyncOpenAI, OpenAI

from app.database import db
from app.models import ToolCallTrace, HandoffTrace, AgentChatResponse, LangChainMessageModel
import app.tools as tool_funcs

set_tracing_disabled(True)
logger = logging.getLogger("pomodoro_agent")

# ==========================================
# TOOL DEFINITIONS USING @function_tool
# ==========================================

@function_tool
def start_session(minutes: int = 25, topic: str = "General Study", user_id: str = "default-student") -> str:
    """Start a timed Pomodoro focus study block with duration in minutes, topic name, and user ID."""
    return tool_funcs.start_session(minutes=minutes, topic=topic, user_id=user_id)

@function_tool
def log_session(
    duration_minutes: int = 25,
    focus_rating: int = 4,
    notes: str = "",
    topic: str = "General Study",
    user_id: str = "default-student"
) -> str:
    """Log a completed study session with duration, focus rating (1-5), notes, topic, and user ID."""
    return tool_funcs.log_session(
        duration_minutes=duration_minutes,
        focus_rating=focus_rating,
        notes=notes,
        topic=topic,
        user_id=user_id
    )

@function_tool
def set_daily_goal(goal_minutes: int = 120, user_id: str = "default-student") -> str:
    """Set the user's daily study goal in total minutes (e.g., 120 for 2 hours) for specific user ID."""
    return tool_funcs.set_daily_goal(goal_minutes=goal_minutes, user_id=user_id)

@function_tool
def get_daily_summary(user_id: str = "default-student") -> str:
    """Fetch the total study time, number of sessions completed today, goal progress, and streak for specific user ID."""
    return tool_funcs.get_daily_summary(user_id=user_id)

@function_tool
def suggest_break_or_session(user_id: str = "default-student") -> str:
    """Evaluate fatigue, total sessions done, and goal progress to decide whether to suggest a 5-minute short break, a 20-minute long break, or another study session using neurobiology protocols."""
    return tool_funcs.suggest_break_or_session(user_id=user_id)

@function_tool
def save_user_schedule_profile(
    user_id: str = "default-student",
    name: str = "Student",
    wake_time: str = "07:00",
    sleep_time: str = "23:00",
    peak_energy_window: str = "morning",
    fixed_commitments: str = "",
    target_exam_or_goal: str = "",
    preferred_pomodoro_length: int = 25
) -> str:
    """Save the student's personal schedule intake profile (waking hours, peak energy window, commitments) to create individualized circadian study plans."""
    return tool_funcs.save_user_schedule_profile(
        user_id=user_id,
        name=name,
        wake_time=wake_time,
        sleep_time=sleep_time,
        peak_energy_window=peak_energy_window,
        fixed_commitments=fixed_commitments,
        target_exam_or_goal=target_exam_or_goal,
        preferred_pomodoro_length=preferred_pomodoro_length
    )

@function_tool
def get_user_schedule_profile(user_id: str = "default-student") -> str:
    """Retrieve the student's schedule intake profile."""
    return tool_funcs.get_user_schedule_profile(user_id=user_id)

@function_tool
def generate_psychological_plan(
    topic: str = "General Study",
    difficulty_level: str = "moderate",
    available_minutes: int = 90,
    goal: str = "Deep Mastery",
    user_id: str = "default-student"
) -> str:
    """Generate a scientifically structured study roadmap incorporating user profile, Yerkes-Dodson arousal calibration, Ultradian cycles, and spaced repetition."""
    return tool_funcs.generate_psychological_plan(
        topic=topic,
        difficulty_level=difficulty_level,
        available_minutes=available_minutes,
        goal=goal,
        user_id=user_id
    )

@function_tool
def generate_performance_report(user_id: str = "default-student") -> str:
    """Generate structured analytical progress report with formatted markdown performance metrics for the user."""
    return tool_funcs.generate_performance_report(user_id=user_id)

@function_tool
def reset_daily_history(user_id: str = "default-student") -> str:
    """Reset all completed sessions, focus time counters, and goals back to 0 for specific user."""
    return tool_funcs.reset_daily_history(user_id=user_id)

# ==========================================
# MULTI-AGENT SWARM DEFINITIONS
# ==========================================

MINDSET_COACH_PROMPT = """You are the Cognitive Architect & Mindset Coach.
You specialize in applied cognitive psychology, circadian scheduling, memory consolidation, and high-performance study protocols.

Your Core Directives:
1. PSYCHOLOGICAL FRAMEWORKS: Ground your advice in:
   - Ultradian Cycles (90m peak focus waves followed by 20m restorative downtime).
   - Circadian Chronobiology (aligning deep work with the student's peak energy window).
   - Yerkes-Dodson Law of Arousal (modulating friction and task difficulty to maintain optimal arousal).
   - Ebbinghaus Spaced Repetition (structuring Day 1, Day 3, Day 7 retrieval tables).
   - Cognitive Load Theory (Sweller) (reducing extraneous cognitive load, chunking complex concepts).
   - Gollwitzer's Implementation Intentions ("If [distraction/fatigue] Then [specific micro-action]").
2. INTAKE & SCHEDULE PROFILING: Proactively ask students about their schedule (wake time, sleep time, peak focus hours, classes/work) and call `save_user_schedule_profile`.
3. OUTPUT FORMATTING: Always structure study roadmaps into clear, beautifully formatted Markdown tables with aligned columns.
4. ACTION-ORIENTED: Call `generate_psychological_plan` when asked for study plans.
"""

FOCUS_SPECIALIST_PROMPT = """You are the Focus Session Specialist.
You run precision Pomodoro focus intervals, eliminate attention residue, and maintain single-task immersion.

Your Core Directives:
1. When the student is ready to study, call `start_session(minutes, topic, user_id)`.
2. When the student reports completed work, call `log_session(duration_minutes, focus_rating, notes, topic, user_id)`.
3. Keep focus instructions punchy, encouraging, and clear.
"""

RECOVERY_SPECIALIST_PROMPT = """You are the Neuro-Rest & Fatigue Specialist.
You evaluate cognitive fatigue, prefrontal cortex saturation, and prescribe evidence-based neuro-recovery resets.

Your Core Directives:
1. Always call `suggest_break_or_session(user_id)` to assess fatigue and current session volume.
2. Prescribe actionable neuro-biological resets:
   - Physiological Sigh (2 quick nasal inhales + 1 extended mouth exhale).
   - Optic Flow & Panoramic Vision (disengage narrow focal strain).
   - Non-Sleep Deep Rest (NSDR) for 20-minute long breaks.
   - 20-20-20 visual resets for screen strain.
3. Encourage guilt-free recovery to maximize downstream focus efficiency.
"""

PERFORMANCE_ANALYST_PROMPT = """You are the Performance Analyst.
You synthesize daily study velocity, focus score distribution, streak momentum, and goal trajectory.

Your Core Directives:
1. Always call `generate_performance_report(user_id)` or `get_daily_summary(user_id)` to retrieve validated data.
2. Present analytics using structured, clean Markdown tables comparing current status vs daily benchmarks.
3. Provide constructive, data-driven optimization recommendations.
"""

ROUTER_ORCHESTRATOR_PROMPT = """You are the Study Router Orchestrator (Head Coach).
You supervise the student's overall learning journey and intelligently delegate tasks to specialized agents:

Delegation Protocols:
- Study Planning, Schedule Intake, Psychological Strategies, Mindset, Exam Roadmaps ➔ Handoff to `Cognitive Architect & Mindset Coach`.
- Starting Focus Blocks, Logging Work, Timer Configuration ➔ Handoff to `Focus Session Specialist`.
- Fatigue Assessment, Break Optimization, Neuro-Rest Protocols ➔ Handoff to `Neuro-Rest & Fatigue Specialist`.
- Progress Summaries, Analytics Tables, Velocity & Streak Reviews ➔ Handoff to `Performance Analyst`.

Maintain a supportive, disciplined, and scientifically grounded tone.
"""

from pydantic import BaseModel, Field

class HandoffData(BaseModel):
    instructions: str = Field(default="Delegating to specialist agent", description="Instructions and parameters for the specialist agent.")

def create_handoff(target_agent: Agent) -> Any:
    return handoff(
        target_agent,
        input_type=HandoffData,
        on_handoff=lambda ctx, data: None
    )

def build_swarm_agents() -> Dict[str, Agent]:
    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("OPENAI_BASE_URL", None)
    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    model = None
    if api_key:
        async_client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        model = OpenAIChatCompletionsModel(model=model_name, openai_client=async_client)

    mindset_agent = Agent(
        name="Cognitive Architect",
        instructions=MINDSET_COACH_PROMPT,
        tools=[generate_psychological_plan, save_user_schedule_profile, get_user_schedule_profile, get_daily_summary, set_daily_goal, start_session],
        model=model
    )

    focus_agent = Agent(
        name="Focus Specialist",
        instructions=FOCUS_SPECIALIST_PROMPT,
        tools=[start_session, log_session, get_daily_summary],
        model=model
    )

    recovery_agent = Agent(
        name="Neuro Rest Specialist",
        instructions=RECOVERY_SPECIALIST_PROMPT,
        tools=[suggest_break_or_session, get_daily_summary, start_session],
        model=model
    )

    performance_agent = Agent(
        name="Performance Analyst",
        instructions=PERFORMANCE_ANALYST_PROMPT,
        tools=[generate_performance_report, get_daily_summary, set_daily_goal],
        model=model
    )

    router_agent = Agent(
        name="Study Router Orchestrator",
        instructions=ROUTER_ORCHESTRATOR_PROMPT,
        handoffs=[
            create_handoff(mindset_agent),
            create_handoff(focus_agent),
            create_handoff(recovery_agent),
            create_handoff(performance_agent)
        ],
        tools=[
            get_daily_summary,
            reset_daily_history
        ],
        model=model
    )

    return {
        "router": router_agent,
        "mindset": mindset_agent,
        "focus": focus_agent,
        "recovery": recovery_agent,
        "performance": performance_agent
    }

swarm = build_swarm_agents()
study_coach_agent = swarm["router"]

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
        import asyncio
        traces: List[ToolCallTrace] = []
        handoffs_list: List[HandoffTrace] = []
        conversation = Conversation(session_id=session_id, user_id=user_id, max_turns=10)
        
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                res = loop.run_until_complete(self._run_with_sdk(user_message, conversation, traces, handoffs_list, user_id))
                loop.close()
                return res
            except Exception as e:
                logger.error(f"OpenAI Agents SDK execution error: {e}")
                return self._run_fallback(user_message, conversation, traces, handoffs_list, user_id)
        else:
            return self._run_fallback(user_message, conversation, traces, handoffs_list, user_id)

    async def _run_with_sdk(
        self,
        user_message: str,
        conversation: Conversation,
        traces: List[ToolCallTrace],
        handoffs_list: List[HandoffTrace],
        user_id: str
    ) -> AgentChatResponse:
        agents_dict = build_swarm_agents()
        router_agent = agents_dict["router"]
        
        summary = db.get_daily_summary(user_id=user_id)
        profile = summary.get("user_profile", {})
        context_prompt = (
            f"{ROUTER_ORCHESTRATOR_PROMPT}\n\n"
            f"[Current Student State: User ID: {user_id}. Name: {profile.get('name', 'Student')}. "
            f"Peak Energy: {profile.get('peak_energy_window', 'morning')}. Waking Hours: {profile.get('wake_time', '07:00')}–{profile.get('sleep_time', '23:00')}. "
            f"Fixed Commitments: {profile.get('fixed_commitments', 'None')}. "
            f"Today: {summary['date']}. Focus time logged: {summary['completed_minutes']}/{summary['target_minutes']} mins. "
            f"Sessions: {summary['sessions_count']}. Streak: {summary['streak_days']} days.]"
        )
        router_agent.instructions = context_prompt

        step_counter = 1
        active_timer = None
        suggested_break = None
        active_agent_name = "Study Router Orchestrator"

        recent_history = conversation.get_recent_history_text(limit=4)
        if recent_history:
            text_input = f"[Recent History]\n{recent_history}\n\nStudent ({user_id}): {user_message}"
        else:
            text_input = f"[Student ID: {user_id}]\n{user_message}"

        result = await Runner.run(router_agent, text_input)
        final_text = result.final_output if hasattr(result, 'final_output') else str(result)
        
        outputs_map = {}
        if hasattr(result, 'new_items'):
            for item in result.new_items:
                item_type = type(item).__name__
                if item_type == "ToolCallOutputItem":
                    cid = getattr(item, 'call_id', '')
                    outputs_map[cid] = getattr(item, 'output', '')

            for item in result.new_items:
                item_type = type(item).__name__
                if item_type == "ToolCallItem":
                    t_name = getattr(item, 'tool_name', 'tool')
                    agent_obj = getattr(item, 'agent', None)
                    current_agent_name = getattr(agent_obj, 'name', active_agent_name)
                    
                    t_args = {}
                    try:
                        raw_item = getattr(item, 'raw_item', None)
                        if raw_item and hasattr(raw_item, 'arguments'):
                            t_args = json.loads(raw_item.arguments)
                        elif raw_item and hasattr(raw_item, 'function') and hasattr(raw_item.function, 'arguments'):
                            t_args = json.loads(raw_item.function.arguments)
                    except Exception:
                        pass

                    cid = getattr(item, 'call_id', '')
                    raw_out = outputs_map.get(cid, '')
                    try:
                        parsed_out = json.loads(raw_out) if isinstance(raw_out, str) else raw_out
                    except Exception:
                        parsed_out = raw_out

                    if t_name.startswith("transfer_to_"):
                        target_name = t_name.replace("transfer_to_", "").replace("_", " ").title()
                        active_agent_name = target_name
                        handoffs_list.append(HandoffTrace(
                            step=step_counter,
                            from_agent=current_agent_name,
                            to_agent=target_name,
                            reason="Specialized domain delegation",
                            timestamp=datetime.now().strftime("%H:%M:%S")
                        ))
                    else:
                        traces.append(ToolCallTrace(
                            step=step_counter,
                            tool_name=str(t_name),
                            agent_name=current_agent_name,
                            arguments=t_args if isinstance(t_args, dict) else {},
                            output=parsed_out,
                            timestamp=datetime.now().strftime("%H:%M:%S")
                        ))

                        if t_name == "start_session":
                            active_timer = t_args.get("minutes", 25)
                        elif t_name == "suggest_break_or_session":
                            if isinstance(parsed_out, dict):
                                suggested_break = parsed_out.get("break_duration_minutes")
                        elif t_name == "generate_psychological_plan":
                            if isinstance(parsed_out, dict):
                                active_timer = parsed_out.get("recommended_first_timer_minutes", 25)
                                suggested_break = parsed_out.get("recommended_break_minutes", 5)

                    step_counter += 1

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
            psychological_framework="OpenAI Agents SDK Multi-Agent Handoff Swarm",
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
                f"👤 **Circadian Schedule Profile Saved for {name}**\n\n"
                f"I have mapped your daily bio-rhythms and locked in your personal preferences:\n\n"
                f"| Schedule Attribute | Configured Value | Circadian Recommendation |\n"
                f"| :--- | :--- | :--- |\n"
                f"| **User Profile** | `{user_id}` | Isolated & Encrypted |\n"
                f"| **Waking Window** | ⏰ {p['wake_time']} – 🌙 {p['sleep_time']} | Optimal Sleep Architecture |\n"
                f"| **Peak Energy Surge** | ⚡ **{p['peak_energy_window'].title()}** | Primary Deep Work Window |\n"
                f"| **Focus Block Size** | ⏱️ {p['preferred_pomodoro_length']} minutes | Ultradian Sprint |\n\n"
                f"💡 **Coach Advice**: Since your peak alertness is in the **{p['peak_energy_window']}**, "
                f"we will schedule high-difficulty problem solving and theory synthesis during that time.\n\n"
                f"What subject would you like to build your first tailored study plan for?"
            )

        # ==========================================
        # 2. ROUTING: PSYCHOLOGICAL STUDY PLANNING
        # ==========================================
        elif re.search(r'\b(plan|schedule|psychological|table|mastery|strategy|roadmap|prepare|syllabus|cognitive|how to study)\b', text):
            active_agent = "Cognitive Architect"
            framework = "Yerkes-Dodson Arousal Calibration & Ultradian Pacing"
            
            handoffs_list.append(HandoffTrace(
                step=step,
                from_agent="Study Router Orchestrator",
                to_agent="Cognitive Architect",
                reason="Student requested evidence-based study plan and schedule matrix",
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
                f"🧠 **Cognitive Architecture Plan for {topic}**\n\n"
                f"{plan_res['personalization_note']}\n\n"
                f"I have calibrated a **{avail_mins}-minute Ultradian study protocol** using **Yerkes-Dodson Arousal Modulation** "
                f"and **Sweller's Cognitive Load Chunking** to maximize retention while preventing cognitive burnout:\n\n"
                f"### 📋 Deep Work & Recovery Roadmap\n\n"
                f"{plan_res['study_table_markdown']}\n\n"
                f"### 🔁 Ebbinghaus Spaced Retrieval Schedule\n\n"
                f"{plan_res['spaced_repetition_table_markdown']}\n\n"
                f"{plan_res['implementation_intention']}\n\n"
                f"🚀 **Next Action**: I've prepped your first **{active_timer}-minute Deep Priming block** on **{topic}**. Ready to start?"
            )

        # ==========================================
        # 3. ROUTING: LOGGING COMPLETED SESSION
        # ==========================================
        elif re.search(r'\b(log|logged|completed|finished|done with|studied for|just finished)\b', text):
            active_agent = "Focus Specialist"
            framework = "Dopamine Reinforcement Loop & Neuro-Recovery"
            
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
                f"✅ **Focus Session Recorded**: **{duration} minutes** on **{topic}** (Focus Rating: {focus_val}/5)!\n\n"
                f"📊 **Cumulative Progress**: {eval_res['total_minutes_today']} / {eval_res['daily_goal_minutes']} mins ({eval_res['sessions_count_today']} sessions today | 🔥 {log_res['streak_days']}-day streak).\n\n"
                f"### 🌿 Recovery Recommendation\n"
                f"{eval_res['guidance']}\n"
                f"• **Protocol**: {eval_res['neuro_recovery_technique']}"
            )

        # ==========================================
        # 4. ROUTING: FATIGUE & RECOVERY EVALUATION
        # ==========================================
        elif any(w in text for w in ["break", "tired", "exhausted", "fatigue", "rest", "burnout", "what next", "should i take a break"]):
            active_agent = "Neuro Rest Specialist"
            framework = "Autonomic Nervous System & Neuro-Recovery"
            
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
                f"🌿 **Neuro-Rest Prescription & Fatigue Assessment**\n\n"
                f"{eval_res['guidance']}\n\n"
                f"### 🧘 Prescribed Neuro-Recovery Protocol\n"
                f"• **Technique**: {eval_res['neuro_recovery_technique']}\n"
                f"• **Rest Duration**: **{eval_res['break_duration_minutes']} minutes**\n"
                f"• **Today's Volume**: {eval_res['total_minutes_today']} / {eval_res['daily_goal_minutes']} mins ({eval_res['sessions_count_today']} sessions logged)\n\n"
                f"Take this recovery window deliberately. When you return, your prefrontal cortex will be fully primed for deep focus."
            )

        # ==========================================
        # 5. ROUTING: STARTING FOCUS SESSION
        # ==========================================
        elif any(w in text for w in ["start", "begin", "focus session", "let's study", "start studying", "start a session", "new session"]):
            active_agent = "Focus Specialist"
            framework = "Single-Task Immersion & Priming"
            
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
                f"⏱️ **Focus Block Initialized**: **{mins} minutes** dedicated to **{topic}**.\n\n"
                f"💡 **Cognitive Priming**: {start_res['coach_tip']}\n"
                f"• **Status**: {start_res['today_completed_so_far']} / {start_res['daily_target']} completed today.\n\n"
                f"Close unrelated browser tabs, silence notifications, and enter deep flow."
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


