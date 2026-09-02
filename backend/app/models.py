from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StudySession(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = "default-student"
    topic: str = "General Study"
    duration_minutes: int = 25
    focus_rating: int = Field(default=4, ge=1, le=5)
    notes: Optional[str] = ""
    created_at: Optional[str] = None

class DailyGoal(BaseModel):
    user_id: Optional[str] = "default-student"
    date: str
    target_minutes: int = 120
    completed_minutes: int = 0
    sessions_count: int = 0
    streak: int = 1
    goal_reached: bool = False

class UserScheduleProfile(BaseModel):
    user_id: str = "default-student"
    name: Optional[str] = "Student"
    wake_time: Optional[str] = "07:00"
    sleep_time: Optional[str] = "23:00"
    peak_energy_window: Optional[str] = "morning"
    fixed_commitments: Optional[str] = ""
    target_exam_or_goal: Optional[str] = ""
    preferred_pomodoro_length: Optional[int] = 25

class SessionStartRequest(BaseModel):
    minutes: int = 25
    topic: str = "General Study"
    user_id: Optional[str] = "default-student"

class SessionLogRequest(BaseModel):
    duration_minutes: int = 25
    focus_rating: int = 4
    notes: Optional[str] = ""
    topic: Optional[str] = "General Study"
    user_id: Optional[str] = "default-student"

class GoalSetRequest(BaseModel):
    goal_minutes: int = 120
    user_id: Optional[str] = "default-student"

class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default-student"
    user_id: Optional[str] = "default-student"

class HandoffTrace(BaseModel):
    step: int
    from_agent: str
    to_agent: str
    reason: str
    timestamp: str

class ToolCallTrace(BaseModel):
    step: int
    tool_name: str
    agent_name: Optional[str] = None
    arguments: Dict[str, Any] = {}
    output: Any = None
    timestamp: str

class AgentChatResponse(BaseModel):
    reply: str
    active_agent: str = "Study Router Orchestrator"
    handoffs: List[HandoffTrace] = []
    traces: List[ToolCallTrace] = []
    daily_summary: Optional[Dict[str, Any]] = None
    active_timer_minutes: Optional[int] = None
    suggested_break_minutes: Optional[int] = None
    psychological_framework: Optional[str] = None
    user_profile: Optional[Dict[str, Any]] = None
