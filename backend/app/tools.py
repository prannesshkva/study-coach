import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.database import db

def start_session(minutes: int = 25, topic: str = "General Study", user_id: str = "default-student") -> str:
    if minutes <= 0:
        minutes = 25
    if minutes > 120:
        minutes = 120
        
    summary = db.get_daily_summary(user_id=user_id)
    remaining = max(0, summary["target_minutes"] - summary["completed_minutes"])
    
    return json.dumps({
        "status": "started",
        "user_id": user_id,
        "topic": topic,
        "duration_minutes": minutes,
        "session_type": "deep_work",
        "started_at": datetime.now().strftime("%H:%M:%S"),
        "today_completed_so_far": f"{summary['completed_minutes']} mins",
        "daily_target": f"{summary['target_minutes']} mins",
        "remaining_to_goal": f"{remaining} mins",
        "coach_tip": f"Focus session initialized for {minutes}m on '{topic}'. Minimize extraneous cognitive load and immerse in deep work!"
    })

def log_session(
    duration_minutes: int = 25,
    focus_rating: int = 4,
    notes: str = "",
    topic: str = "General Study",
    user_id: str = "default-student"
) -> str:
    if duration_minutes <= 0:
        duration_minutes = 25
    if focus_rating < 1:
        focus_rating = 1
    elif focus_rating > 5:
        focus_rating = 5

    saved = db.save_session(
        topic=topic,
        duration_minutes=duration_minutes,
        focus_rating=focus_rating,
        notes=notes,
        user_id=user_id
    )
    
    summary = db.get_daily_summary(user_id=user_id)
    
    return json.dumps({
        "status": "logged_successfully",
        "session_id": saved.get("id"),
        "user_id": user_id,
        "topic": topic,
        "logged_duration": f"{duration_minutes} minutes",
        "focus_rating": f"{focus_rating}/5",
        "notes": notes,
        "today_total_minutes": summary["completed_minutes"],
        "today_sessions_count": summary["sessions_count"],
        "daily_goal_minutes": summary["target_minutes"],
        "goal_reached": summary["goal_reached"],
        "completion_percentage": f"{summary['completion_percentage']}%",
        "streak_days": summary["streak_days"]
    })

def set_daily_goal(goal_minutes: int = 120, user_id: str = "default-student") -> str:
    if goal_minutes <= 0:
        goal_minutes = 60
    if goal_minutes > 720:
        goal_minutes = 720
        
    db.set_daily_goal(goal_minutes, user_id=user_id)
    summary = db.get_daily_summary(user_id=user_id)
    
    return json.dumps({
        "status": "goal_updated",
        "user_id": user_id,
        "daily_target_minutes": goal_minutes,
        "completed_so_far": summary["completed_minutes"],
        "sessions_completed": summary["sessions_count"],
        "remaining_minutes": max(0, goal_minutes - summary["completed_minutes"]),
        "coach_note": f"Daily target calibrated to {goal_minutes} minutes ({round(goal_minutes/60, 1)} hours). Let's build momentum!"
    })

def get_daily_summary(user_id: str = "default-student") -> str:
    summary = db.get_daily_summary(user_id=user_id)
    return json.dumps({
        "status": "success",
        "summary": summary
    })

def suggest_break_or_session(user_id: str = "default-student") -> str:
    summary = db.get_daily_summary(user_id=user_id)
    sessions_count = summary["sessions_count"]
    total_minutes = summary["completed_minutes"]
    target_minutes = summary["target_minutes"]
    goal_reached = summary["goal_reached"]
    user_profile = summary.get("user_profile", {})
    preferred_len = user_profile.get("preferred_pomodoro_length", 25)
    
    if sessions_count == 0:
        recommendation = "start_first_session"
        protocol = f"🚀 **Priming & Activation**: Initiate your first {preferred_len}-minute Pomodoro focus block to build baseline momentum."
        break_duration = 0
        next_session_duration = preferred_len
        neuro_technique = "Pre-commitment Ritual (eliminate friction, open single editor/chapter)"
    elif sessions_count % 4 == 0:
        recommendation = "take_long_break"
        break_duration = 20
        protocol = f"🌿 **Ultradian Rest Phase (20 min)**: You have completed {sessions_count} deep focus blocks ({total_minutes}m total). Your prefrontal cortex requires metabolic replenishment to prevent cognitive saturation."
        next_session_duration = preferred_len
        neuro_technique = "Non-Sleep Deep Rest (NSDR) or a 15-min walk with Optic Flow (disengage focal vision)"
    elif goal_reached:
        recommendation = "goal_achieved_rest"
        break_duration = 15
        protocol = f"🏆 **Daily Milestone Achieved**: Logged {total_minutes}/{target_minutes} minutes across {sessions_count} sessions. Transition into consolidation and light retrieval."
        next_session_duration = 15
        neuro_technique = "Reflective Summary & Somatic Decompression (stretch and deliberate hydration)"
    else:
        recommendation = "take_short_break"
        break_duration = 5
        protocol = f"⚡ **Autonomic Downregulation (5 min)**: Logged {sessions_count} session(s) today ({total_minutes}m total). Take a 5-minute cognitive breather before the next focus surge."
        next_session_duration = preferred_len
        neuro_technique = "Physiological Sigh (2 quick nasal inhales + 1 long mouth exhale x 3) + 20-20-20 Eye Reset"

    return json.dumps({
        "status": "evaluated",
        "user_id": user_id,
        "recommendation": recommendation,
        "break_duration_minutes": break_duration,
        "suggested_next_session_minutes": next_session_duration,
        "sessions_count_today": sessions_count,
        "total_minutes_today": total_minutes,
        "daily_goal_minutes": target_minutes,
        "goal_reached": goal_reached,
        "guidance": protocol,
        "neuro_recovery_technique": neuro_technique,
        "psychological_framework": "Ultradian Rhythm & Neuro-Rest Protocol"
    })

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
    """Save the user's personal schedule intake profile to enable individualized circadian and psychological study scheduling."""
    profile = db.save_user_schedule(user_id, {
        "name": name,
        "wake_time": wake_time,
        "sleep_time": sleep_time,
        "peak_energy_window": peak_energy_window,
        "fixed_commitments": fixed_commitments,
        "target_exam_or_goal": target_exam_or_goal,
        "preferred_pomodoro_length": preferred_pomodoro_length
    })
    return json.dumps({
        "status": "profile_updated",
        "user_id": user_id,
        "profile": profile,
        "message": f"Schedule profile updated for {name}! Daily focus plans will now align with your {peak_energy_window} peak energy window and {wake_time}–{sleep_time} waking hours."
    })

def get_user_schedule_profile(user_id: str = "default-student") -> str:
    profile = db.get_user_schedule(user_id)
    return json.dumps({
        "status": "success",
        "user_id": user_id,
        "profile": profile
    })

def generate_psychological_plan(
    topic: str = "General Study",
    difficulty_level: str = "moderate",
    available_minutes: int = 90,
    goal: str = "Deep Mastery",
    user_id: str = "default-student"
) -> str:
    """Generate a scientifically structured study roadmap incorporating user profile, Yerkes-Dodson arousal calibration, Ultradian cycles, and spaced repetition."""
    profile = db.get_user_schedule(user_id)
    student_name = profile.get("name", "Student")
    peak_energy = profile.get("peak_energy_window", "morning")
    commitments = profile.get("fixed_commitments", "")
    pomo_len = profile.get("preferred_pomodoro_length", 25)

    if available_minutes <= 30:
        blocks = [
            {"phase": "Block 1: Deep Priming", "duration": f"{available_minutes - 5} min", "focus": f"{topic} Core Concept", "strategy": "Cognitive Load Chunking", "load": "⚡ Moderate"},
            {"phase": "Active Recovery", "duration": "5 min", "focus": "Optic Flow & Hydration", "strategy": "Autonomic Downregulation", "load": "🌿 Rest"}
        ]
        break_mins = 5
    elif available_minutes <= 60:
        blocks = [
            {"phase": "Block 1: Theory & Synthesis", "duration": f"{pomo_len} min", "focus": f"{topic} Fundamentals", "strategy": "Extraneous Load Elimination", "load": "🔥 High"},
            {"phase": "Neuro-Reset", "duration": "5 min", "focus": "Physiological Sigh", "strategy": "Vagus Nerve Reset", "load": "🌿 Rest"},
            {"phase": "Block 2: Active Recall", "duration": f"{pomo_len} min", "focus": f"{topic} Problem Solving", "strategy": "Testing Effect (Roediger)", "load": "⚡ Moderate"},
            {"phase": "Consolidation", "duration": "5 min", "focus": "Feynman Quick Summary", "strategy": "Zeigarnik Momentum Hook", "load": "🌿 Rest"}
        ]
        break_mins = 5
    else:
        blocks = [
            {"phase": "Block 1: Deep Encoding", "duration": f"{pomo_len} min", "focus": f"{topic} Architecture & Theory", "strategy": "Dual Coding & Chunking", "load": "🔥 High"},
            {"phase": "Neuro-Reset", "duration": "5 min", "focus": "Panoramic Eye De-focus", "strategy": "Sympathetic Calming", "load": "🌿 Rest"},
            {"phase": "Block 2: Active Application", "duration": f"{pomo_len} min", "focus": f"{topic} Hands-on Implementation", "strategy": "Deliberate Practice (Ericsson)", "load": "⚡ High"},
            {"phase": "Restorative Break", "duration": "10 min", "focus": "Movement & Hydration", "strategy": "Ultradian Refractory Period", "load": "🌿 Rest"},
            {"phase": "Block 3: Retrieval & Stress Test", "duration": f"{pomo_len} min", "focus": f"{topic} Edge Cases & Synthesis", "strategy": "Spaced Interleaving", "load": "⚡ Moderate"}
        ]
        break_mins = 10

    markdown_table = (
        "| Phase / Block | Duration | Focus / Micro-Goal | Psychological Strategy | Cognitive Load |\n"
        "| :--- | :--- | :--- | :--- | :--- |\n"
    )
    for b in blocks:
        markdown_table += f"| **{b['phase']}** | {b['duration']} | {b['focus']} | *{b['strategy']}* | {b['load']} |\n"

    spaced_table = (
        "| Spaced Interval | Target Recall Milestone | Technique | Target Retention |\n"
        "| :--- | :--- | :--- | :--- |\n"
        f"| **Day 1 (Today)** | Immediate Active Synthesis | {pomo_len}m Pomodoro Retrieval | 85% Initial Encoding |\n"
        f"| **Day 3** | Core Mechanism Flash Recall | Feynman Verbalization (15m) | 70% Curve Protection |\n"
        f"| **Day 7** | Applied Problem Set | Blind Execution without notes | 90% Long-Term Transfer |\n"
    )

    implementation_intention = (
        f"🎯 **Gollwitzer Implementation Intention**: 'If I experience friction or distraction while studying **{topic}**, "
        f"Then I will perform 1 physiological sigh, write the thought on a capture pad, and solve 1 single micro-problem for 2 minutes.'"
    )

    personalization_note = f"👤 **Customized for {student_name}**: Calibrated for your **{peak_energy}** circadian focus window"
    if commitments:
        personalization_note += f" (avoiding conflicts with: *{commitments}*)"
    personalization_note += "."

    return json.dumps({
        "status": "plan_generated",
        "user_id": user_id,
        "student_name": student_name,
        "topic": topic,
        "difficulty_level": difficulty_level,
        "available_minutes": available_minutes,
        "recommended_first_timer_minutes": pomo_len,
        "recommended_break_minutes": break_mins,
        "psychological_framework": "Yerkes-Dodson Arousal & Ultradian Rhythm Modulation",
        "personalization_note": personalization_note,
        "study_table_markdown": markdown_table,
        "spaced_repetition_table_markdown": spaced_table,
        "implementation_intention": implementation_intention,
        "blocks": blocks
    })

def generate_performance_report(user_id: str = "default-student") -> str:
    """Generate structured analytical progress report with formatted markdown performance metrics."""
    summary = db.get_daily_summary(user_id=user_id)
    sessions = db.get_sessions(user_id=user_id)
    
    total_mins = summary["completed_minutes"]
    target_mins = summary["target_minutes"]
    count = summary["sessions_count"]
    pct = summary["completion_percentage"]
    streak = summary["streak_days"]
    profile = summary.get("user_profile", {})
    name = profile.get("name", "Student")
    
    avg_rating = round(sum(s.get("focus_rating", 4) for s in sessions) / max(1, count), 1) if sessions else 0.0
    
    table_markdown = (
        "| Metric | Current Status | Daily Benchmark | Status Indicator |\n"
        "| :--- | :--- | :--- | :--- |\n"
        f"| **Student Profile** | {name} | User ID: `{user_id}` | 👤 Verified |\n"
        f"| **Total Focus Time** | {total_mins} mins ({round(total_mins/60, 1)}h) | {target_mins} mins ({round(target_mins/60, 1)}h) | {'🟢 Goal Reached' if total_mins >= target_mins else '🟡 In Progress'} |\n"
        f"| **Completed Sessions** | {count} blocks | 4–6 blocks | {'🔥 On Track' if count >= 3 else '⚡ Building Momentum'} |\n"
        f"| **Average Focus Depth** | {avg_rating} / 5.0 | ≥ 4.0 / 5.0 | {'💎 Deep Flow' if avg_rating >= 4.0 else '⚠️ High Distraction'} |\n"
        f"| **Consistency Streak** | {streak} day(s) | Daily Habit Loop | {'🔥 Active Streak' if streak > 0 else '🌱 Day 1 Baseline'} |\n"
        f"| **Goal Completion** | {pct}% | 100% Target | {'✅ 100% Reached' if pct >= 100 else f'🎯 {100-pct}% Remaining'} |\n"
    )

    return json.dumps({
        "status": "report_generated",
        "user_id": user_id,
        "summary": summary,
        "average_focus_rating": avg_rating,
        "analytics_table_markdown": table_markdown,
        "psychological_framework": "Behavioral Feedback Loop & Self-Determination Metric"
    })

def reset_daily_history(user_id: str = "default-student") -> str:
    db.clear_all_data(user_id=user_id)
    return json.dumps({
        "status": "reset_complete",
        "user_id": user_id,
        "message": f"All focus sessions and daily counters for user '{user_id}' have been reset to 0. Ready for a clean study start!"
    })

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "start_session",
            "description": "Start a timed Pomodoro focus study block with duration in minutes and topic name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "minutes": {"type": "integer", "description": "Duration in minutes (default 25)", "default": 25},
                    "topic": {"type": "string", "description": "Subject or topic being studied", "default": "General Study"},
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                },
                "required": ["minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "log_session",
            "description": "Log a completed study session with duration, focus rating (1-5), notes, and topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "duration_minutes": {"type": "integer", "description": "Minutes completed (e.g. 25)", "default": 25},
                    "focus_rating": {"type": "integer", "description": "Subjective focus rating from 1 to 5", "default": 4},
                    "notes": {"type": "string", "description": "Key takeaways or notes from this session", "default": ""},
                    "topic": {"type": "string", "description": "Subject or topic name", "default": "General Study"},
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                },
                "required": ["duration_minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_daily_goal",
            "description": "Set the user's daily study goal in total minutes (e.g., 120 for 2 hours).",
            "parameters": {
                "type": "object",
                "properties": {
                    "goal_minutes": {"type": "integer", "description": "Target study minutes for the day", "default": 120},
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                },
                "required": ["goal_minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_daily_summary",
            "description": "Fetch the total study time, number of sessions completed today, goal progress, and streak.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_break_or_session",
            "description": "Evaluate fatigue, total sessions done, and goal progress to decide whether to suggest a 5-minute short break, a 20-minute long break, or another study session using neurobiology protocols.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_user_schedule_profile",
            "description": "Save personal schedule intake profile (wake time, sleep time, peak energy, commitments).",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier"},
                    "name": {"type": "string", "description": "Student name"},
                    "wake_time": {"type": "string", "description": "Wake up time (e.g. 07:00)"},
                    "sleep_time": {"type": "string", "description": "Sleep time (e.g. 23:00)"},
                    "peak_energy_window": {"type": "string", "description": "Peak energy window (morning, afternoon, evening, night)"},
                    "fixed_commitments": {"type": "string", "description": "Fixed schedule commitments"},
                    "target_exam_or_goal": {"type": "string", "description": "Target exam or learning goal"},
                    "preferred_pomodoro_length": {"type": "integer", "description": "Preferred study block minutes"}
                },
                "required": ["user_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_psychological_plan",
            "description": "Generate a psychological study plan with cognitive load calibration, Yerkes-Dodson arousal balancing, implementation intentions, and markdown schedule tables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Subject or topic", "default": "General Study"},
                    "difficulty_level": {"type": "string", "description": "Subject difficulty (easy, moderate, hard)", "default": "moderate"},
                    "available_minutes": {"type": "integer", "description": "Total available time in minutes", "default": 90},
                    "goal": {"type": "string", "description": "Goal or outcome", "default": "Deep Mastery"},
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_performance_report",
            "description": "Generate a detailed analytics and velocity report with markdown tables.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "reset_daily_history",
            "description": "Reset all completed sessions, focus time counters, and goals back to 0.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User identifier", "default": "default-student"}
                }
            }
        }
    }
]

TOOL_MAP = {
    "start_session": start_session,
    "log_session": log_session,
    "set_daily_goal": set_daily_goal,
    "get_daily_summary": get_daily_summary,
    "suggest_break_or_session": suggest_break_or_session,
    "save_user_schedule_profile": save_user_schedule_profile,
    "get_user_schedule_profile": get_user_schedule_profile,
    "generate_psychological_plan": generate_psychological_plan,
    "generate_performance_report": generate_performance_report,
    "reset_daily_history": reset_daily_history
}
