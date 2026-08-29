from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class StudySession(BaseModel):
    id: Optional[str] = None
    topic: str = "General Study"
    duration_minutes: int = 25
    focus_rating: int = Field(default=4, ge=1, le=5)
    notes: Optional[str] = ""
    created_at: Optional[str] = None

class DailyGoal(BaseModel):
    date: str
    target_minutes: int = 120
    completed_minutes: int = 0
    sessions_count: int = 0
    streak: int = 1
    goal_reached: bool = False

class SessionStartRequest(BaseModel):
    minutes: int = 25
    topic: str = "General Study"

class SessionLogRequest(BaseModel):
    duration_minutes: int = 25
    focus_rating: int = 4
    notes: Optional[str] = ""
    topic: Optional[str] = "General Study"

class GoalSetRequest(BaseModel):
    goal_minutes: int = 120

class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default-student"

class ToolCallTrace(BaseModel):
    step: int
    tool_name: str
    arguments: Dict[str, Any]
    output: Any
    timestamp: str

class AgentChatResponse(BaseModel):
    reply: str
    traces: List[ToolCallTrace] = []
    daily_summary: Optional[Dict[str, Any]] = None
    active_timer_minutes: Optional[int] = None
    suggested_break_minutes: Optional[int] = None
