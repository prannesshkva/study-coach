import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.database import db

def start_session(minutes: int = 25, topic: str = "General Study") -> str:
    if minutes <= 0:
        minutes = 25
    if minutes > 120:
        minutes = 120
        
    summary = db.get_daily_summary()
    remaining = max(0, summary["target_minutes"] - summary["completed_minutes"])
    
    return json.dumps({
        "status": "started",
        "topic": topic,
        "duration_minutes": minutes,
        "session_type": "deep_work",
        "started_at": datetime.now().strftime("%H:%M:%S"),
        "today_completed_so_far": f"{summary['completed_minutes']} mins",
        "daily_target": f"{summary['target_minutes']} mins",
        "remaining_to_goal": f"{remaining} mins",
        "coach_tip": f"Session active for {minutes}m on '{topic}'. Minimize phone notifications and stay single-tasked!"
    })

def log_session(duration_minutes: int = 25, focus_rating: int = 4, notes: str = "", topic: str = "General Study") -> str:
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
        notes=notes
    )
    
    summary = db.get_daily_summary()
    
    return json.dumps({
        "status": "logged_successfully",
        "session_id": saved.get("id"),
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

def set_daily_goal(goal_minutes: int = 120) -> str:
    if goal_minutes <= 0:
        goal_minutes = 60
    if goal_minutes > 720:
        goal_minutes = 720
        
    db.set_daily_goal(goal_minutes)
    summary = db.get_daily_summary()
    
    return json.dumps({
        "status": "goal_updated",
        "daily_target_minutes": goal_minutes,
        "completed_so_far": summary["completed_minutes"],
        "sessions_completed": summary["sessions_count"],
        "remaining_minutes": max(0, goal_minutes - summary["completed_minutes"]),
        "coach_note": f"Daily target set to {goal_minutes} minutes ({round(goal_minutes/60, 1)} hours). Let's make it happen!"
    })

def get_daily_summary() -> str:
    summary = db.get_daily_summary()
    return json.dumps({
        "status": "success",
        "summary": summary
    })

def suggest_break_or_session() -> str:
    summary = db.get_daily_summary()
    sessions_count = summary["sessions_count"]
    total_minutes = summary["completed_minutes"]
    target_minutes = summary["target_minutes"]
    goal_reached = summary["goal_reached"]
    
    if sessions_count == 0:
        recommendation = "start_first_session"
        action = "Start your first 25-minute Pomodoro focus block to build study momentum."
        break_duration = 0
        next_session_duration = 25
    elif sessions_count % 4 == 0:
        recommendation = "take_long_break"
        break_duration = 20
        action = f"Outstanding work! You have completed {sessions_count} focus sessions ({total_minutes}m total). Take a restorative 20-minute long break. Step away from the screen, stretch, and hydrate."
        next_session_duration = 25
    elif goal_reached:
        recommendation = "goal_achieved_rest"
        break_duration = 15
        action = f"Daily goal achieved! You completed {total_minutes}/{target_minutes} minutes across {sessions_count} sessions. You can wind down or do a light 15-minute review if desired."
        next_session_duration = 15
    else:
        recommendation = "take_short_break"
        break_duration = 5
        action = f"Great session! You've logged {sessions_count} session(s) today ({total_minutes}m total). Take a 5-minute short break to rest your eyes before the next study block."
        next_session_duration = 25

    return json.dumps({
        "status": "evaluated",
        "recommendation": recommendation,
        "break_duration_minutes": break_duration,
        "suggested_next_session_minutes": next_session_duration,
        "sessions_count_today": sessions_count,
        "total_minutes_today": total_minutes,
        "daily_goal_minutes": target_minutes,
        "goal_reached": goal_reached,
        "guidance": action
    })

def reset_daily_history() -> str:
    db.clear_all_data()
    return json.dumps({
        "status": "reset_complete",
        "message": "All focus sessions and daily counters have been reset to 0. Ready for a clean study start!"
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
                    "topic": {"type": "string", "description": "Subject or topic being studied", "default": "General Study"}
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
                    "topic": {"type": "string", "description": "Subject or topic name", "default": "General Study"}
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
                    "goal_minutes": {"type": "integer", "description": "Target study minutes for the day", "default": 120}
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
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_break_or_session",
            "description": "Evaluate fatigue, total sessions done, and goal progress to decide whether to suggest a 5-minute short break, a 20-minute long break, or another study session.",
            "parameters": {
                "type": "object",
                "properties": {}
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
                "properties": {}
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
    "reset_daily_history": reset_daily_history
}
