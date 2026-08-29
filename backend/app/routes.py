from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models import (
    AgentChatRequest, AgentChatResponse,
    SessionStartRequest, SessionLogRequest, GoalSetRequest
)
from app.agent import agent_runner
from app.database import db
from app.tools import TOOL_MAP
import json

router = APIRouter(prefix="/api")

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(req: AgentChatRequest):
    try:
        response = agent_runner.run_agentic_loop(
            user_message=req.message,
            session_id=req.session_id or "default-student"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
async def get_summary():
    return db.get_daily_summary()

@router.post("/goal")
async def set_goal(req: GoalSetRequest):
    res = db.set_daily_goal(req.goal_minutes)
    summary = db.get_daily_summary()
    return {"status": "success", "goal": res, "summary": summary}

@router.post("/session/start")
async def start_session_endpoint(req: SessionStartRequest):
    res_str = TOOL_MAP["start_session"](minutes=req.minutes, topic=req.topic)
    return json.loads(res_str)

@router.post("/session/log")
async def log_session_endpoint(req: SessionLogRequest):
    res_str = TOOL_MAP["log_session"](
        duration_minutes=req.duration_minutes,
        focus_rating=req.focus_rating,
        notes=req.notes or "",
        topic=req.topic or "General Study"
    )
    return json.loads(res_str)

@router.get("/sessions")
async def get_sessions_list():
    sessions = db.get_sessions()
    return {"sessions": sessions, "count": len(sessions)}

@router.post("/reset")
async def reset_data():
    db.clear_all_data()
    return {"status": "success", "message": "All session data and agent memory have been reset to 0.", "summary": db.get_daily_summary()}

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "Study Coach",
        "database": "Cloud Database" if db.use_supabase else "Local Engine",
        "agent_ready": True
    }
