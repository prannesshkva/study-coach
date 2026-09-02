import os
import sys
import json

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, os.path.dirname(__file__))

from app.database import db
from app.tools import (
    start_session, log_session, set_daily_goal, get_daily_summary,
    suggest_break_or_session, generate_psychological_plan, generate_performance_report,
    save_user_schedule_profile, get_user_schedule_profile
)
from app.agent import agent_runner

def test_tools():
    user1 = "test-alice"
    
    # 1. Schedule profile
    prof_res = save_user_schedule_profile(
        user_id=user1,
        name="Alice",
        wake_time="06:30",
        sleep_time="22:30",
        peak_energy_window="morning",
        fixed_commitments="Physics Lab",
        preferred_pomodoro_length=25
    )
    assert "profile_updated" in prof_res
    
    # 2. Goal setting
    goal_res = set_daily_goal(120, user_id=user1)
    assert "120" in goal_res
    
    # 3. Start session
    start_res = start_session(25, "Operating Systems", user_id=user1)
    assert "started" in start_res
    
    # 4. Log session
    log_res = log_session(25, 5, "Finished Process Scheduling chapter", "Operating Systems", user_id=user1)
    assert "logged_successfully" in log_res
    
    # 5. Summary
    summary_res = get_daily_summary(user_id=user1)
    assert "summary" in summary_res
    
    # 6. Neuro-recovery evaluation
    break_res = suggest_break_or_session(user_id=user1)
    assert "recommendation" in break_res
    assert "neuro_recovery_technique" in break_res

    # 7. Personalized psychological study plan
    plan_res = generate_psychological_plan("Distributed Systems", "hard", 90, "Deep Mastery", user_id=user1)
    assert "plan_generated" in plan_res
    assert "study_table_markdown" in plan_res
    assert "spaced_repetition_table_markdown" in plan_res
    assert "Alice" in plan_res or "morning" in plan_res

    # 8. Performance report
    perf_res = generate_performance_report(user_id=user1)
    assert "report_generated" in perf_res
    assert "analytics_table_markdown" in perf_res

def test_multi_user_data_isolation():
    userA = "student-alex"
    userB = "student-beth"
    
    # Clear both users
    db.clear_all_data(user_id=userA)
    db.clear_all_data(user_id=userB)
    
    # User A logs 50 minutes (2 sessions)
    db.set_daily_goal(150, user_id=userA)
    db.save_session(topic="Algorithms", duration_minutes=25, focus_rating=5, user_id=userA)
    db.save_session(topic="Algorithms", duration_minutes=25, focus_rating=4, user_id=userA)
    
    # User B logs 30 minutes (1 session)
    db.set_daily_goal(60, user_id=userB)
    db.save_session(topic="Chemistry", duration_minutes=30, focus_rating=4, user_id=userB)
    
    sumA = db.get_daily_summary(user_id=userA)
    sumB = db.get_daily_summary(user_id=userB)
    
    # Verify strict isolation
    assert sumA["completed_minutes"] == 50
    assert sumA["sessions_count"] == 2
    assert sumA["target_minutes"] == 150
    
    assert sumB["completed_minutes"] == 30
    assert sumB["sessions_count"] == 1
    assert sumB["target_minutes"] == 60
    
    sessA = db.get_sessions(user_id=userA)
    sessB = db.get_sessions(user_id=userB)
    assert len(sessA) == 2
    assert len(sessB) == 1
    assert all(s["topic"] == "Algorithms" for s in sessA)
    assert all(s["topic"] == "Chemistry" for s in sessB)

def test_agent_plan_act_loop():
    user_id = "test-agent-user"
    session_id = f"{user_id}-session"
    db.clear_all_data(user_id=user_id)
    
    # Test 1: Deterministic Fallback Engine (Verifies exact routing, handoffs & tool traces for all 5 specialist agents)
    from app.agent import Conversation
    
    # 1a. Cognitive Architect routing for psychological plan & schedule tables
    conv1 = Conversation(session_id=f"{user_id}-plan", user_id=user_id)
    fb_res1 = agent_runner._run_fallback(
        "Please build a psychological study plan with tables for Computer Networks for 90 minutes",
        conv1,
        [],
        [],
        user_id
    )
    assert len(fb_res1.traces) >= 1
    assert len(fb_res1.handoffs) >= 1
    assert fb_res1.active_agent == "Cognitive Architect"
    assert "|" in fb_res1.reply
    assert "study_table_markdown" in json.dumps(fb_res1.traces[0].output) or "|" in fb_res1.reply

    # 1b. Schedule Intake Profiling
    conv_sched = Conversation(session_id=f"{user_id}-sched", user_id=user_id)
    fb_sched = agent_runner._run_fallback(
        "My schedule is wake at 7am, sleep at 11pm, and I am a night owl",
        conv_sched,
        [],
        [],
        user_id
    )
    assert len(fb_sched.traces) >= 1
    assert fb_sched.active_agent == "Cognitive Architect"
    assert "Night Owl" in fb_sched.reply or "night" in fb_sched.reply.lower()

    # 1c. Focus Specialist logging + Neuro Rest Specialist handoff
    conv2 = Conversation(session_id=f"{user_id}-log", user_id=user_id)
    fb_res2 = agent_runner._run_fallback(
        "I just completed 25 minutes on Distributed Systems with rating 5! Should I take a break?",
        conv2,
        [],
        [],
        user_id
    )
    assert len(fb_res2.traces) >= 2
    assert len(fb_res2.handoffs) >= 2
    assert fb_res2.active_agent == "Focus Specialist"
    assert any("Neuro" in h.to_agent for h in fb_res2.handoffs)

    # 1d. Performance Analyst analytics report
    conv3 = Conversation(session_id=f"{user_id}-analytics", user_id=user_id)
    fb_res3 = agent_runner._run_fallback(
        "Show my progress and analytics report",
        conv3,
        [],
        [],
        user_id
    )
    assert len(fb_res3.traces) >= 1
    assert len(fb_res3.handoffs) >= 1
    assert fb_res3.active_agent == "Performance Analyst"
    assert "|" in fb_res3.reply

    # 1e. Starting focus session
    conv4 = Conversation(session_id=f"{user_id}-start", user_id=user_id)
    fb_res4 = agent_runner._run_fallback(
        "Start a 25m focus session on Distributed Systems",
        conv4,
        [],
        [],
        user_id
    )
    assert len(fb_res4.traces) >= 1
    assert fb_res4.active_agent == "Focus Specialist"
    assert fb_res4.active_timer_minutes == 25

    # Test 2: Isolated memory retention
    memory = db.get_memory(f"{user_id}-plan", user_id=user_id)
    assert len(memory) >= 2
    
    # Test 3: Live Agent Runner
    res_live = agent_runner.run_agentic_loop("Hi, what should I study today?", session_id=session_id, user_id=user_id)
    assert len(res_live.reply) > 0
    assert res_live.active_agent is not None
    
    db.clear_all_data(user_id=user_id)

if __name__ == "__main__":
    print("1/3 Running Tools tests...")
    test_tools()
    print("2/3 Running Multi-User Data Isolation tests...")
    test_multi_user_data_isolation()
    print("3/3 Running Agent Swarm & Orchestration tests...")
    test_agent_plan_act_loop()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")



