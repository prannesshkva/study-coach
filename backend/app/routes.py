from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from app.models import (
    AgentChatRequest, AgentChatResponse,
    SessionStartRequest, SessionLogRequest, GoalSetRequest, UserScheduleProfile,
    SessionMessagesResponse, SessionClearRequest, LangChainMessageModel
)
from app.agent import agent_runner, LangChainSessionMemory
from app.database import db
from app.tools import TOOL_MAP
import json

router = APIRouter(prefix="/api")

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(req: AgentChatRequest):
    try:
        user_id = req.user_id or "default-student"
        session_id = req.session_id or f"{user_id}-main"
        response = agent_runner.run_agentic_loop(
            user_message=req.message,
            session_id=session_id,
            user_id=user_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# LANGCHAIN SESSION MESSAGE API ENDPOINTS
# ==========================================

@router.get("/session/messages", response_model=SessionMessagesResponse)
async def get_session_messages(
    session_id: str = Query(..., description="Session identifier"),
    user_id: str = Query("default-student", description="Student user ID"),
    limit: int = Query(20, ge=1, le=100, description="Max messages to return")
):
    """
    Retrieve standardized LangChain message records (HumanMessage, AIMessage, SystemMessage)
    for the specified user session.
    """
    memory = LangChainSessionMemory(session_id=session_id, user_id=user_id, max_turns=limit)
    models = memory.to_models()
    return SessionMessagesResponse(
        session_id=session_id,
        user_id=user_id,
        message_count=len(models),
        messages=models
    )

@router.post("/session/clear")
async def clear_session(req: SessionClearRequest):
    """
    Clear conversation memory and messages for a specific session and user.
    """
    user_id = req.user_id or "default-student"
    memory = LangChainSessionMemory(session_id=req.session_id, user_id=user_id)
    memory.clear()
    return {
        "status": "success",
        "message": f"Session '{req.session_id}' for user '{user_id}' cleared successfully."
    }

@router.get("/session/list")
async def list_active_sessions(user_id: str = Query("default-student")):
    """
    List all active conversation sessions for the specified user.
    """
    sessions = db.get_user_sessions_list(user_id=user_id)
    return {
        "status": "success",
        "user_id": user_id,
        "sessions": sessions,
        "count": len(sessions)
    }

# ==========================================
# DASHBOARD, GOAL & PROFILE ENDPOINTS
# ==========================================

@router.get("/summary")
async def get_summary(user_id: str = Query("default-student")):
    return db.get_daily_summary(user_id=user_id)

@router.post("/goal")
async def set_goal(req: GoalSetRequest):
    user_id = req.user_id or "default-student"
    res = db.set_daily_goal(req.goal_minutes, user_id=user_id)
    summary = db.get_daily_summary(user_id=user_id)
    return {"status": "success", "goal": res, "summary": summary}

@router.post("/session/start")
async def start_session_endpoint(req: SessionStartRequest):
    user_id = req.user_id or "default-student"
    res_str = TOOL_MAP["start_session"](minutes=req.minutes, topic=req.topic, user_id=user_id)
    return json.loads(res_str)

@router.post("/session/log")
async def log_session_endpoint(req: SessionLogRequest):
    user_id = req.user_id or "default-student"
    res_str = TOOL_MAP["log_session"](
        duration_minutes=req.duration_minutes,
        focus_rating=req.focus_rating,
        notes=req.notes or "",
        topic=req.topic or "General Study",
        user_id=user_id
    )
    return json.loads(res_str)

@router.get("/sessions")
async def get_sessions_list(user_id: str = Query("default-student")):
    sessions = db.get_sessions(user_id=user_id)
    return {"sessions": sessions, "count": len(sessions), "user_id": user_id}

@router.post("/schedule/profile")
async def update_schedule_profile(profile: UserScheduleProfile):
    saved = db.save_user_schedule(profile.user_id, profile.dict())
    summary = db.get_daily_summary(user_id=profile.user_id)
    return {"status": "success", "profile": saved, "summary": summary}

@router.get("/schedule/profile")
async def get_schedule_profile(user_id: str = Query("default-student")):
    profile = db.get_user_schedule(user_id)
    return {"status": "success", "profile": profile, "user_id": user_id}

@router.post("/reset")
async def reset_data(user_id: str = Query("default-student")):
    db.clear_all_data(user_id=user_id)
    return {
        "status": "success",
        "message": f"All session data and agent memory for user '{user_id}' have been reset to 0.",
        "summary": db.get_daily_summary(user_id=user_id)
    }

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "agent": "Study Coach Swarm (Router + Cognitive + Focus + Rest + Performance)",
        "database": "Cloud Database" if db.use_supabase else "Local Engine",
        "langchain_messages": True,
        "agent_ready": True
    }
