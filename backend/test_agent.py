import os
import sys
import json

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, os.path.dirname(__file__))

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from app.database import db
from app.tools import (
    start_session, log_session, set_daily_goal, get_daily_summary,
    suggest_break_or_session, generate_psychological_plan, generate_performance_report,
    save_user_schedule_profile, get_user_schedule_profile
)
from app.agent import agent_runner, LangChainSessionMemory, Conversation

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

def test_langchain_session_management():
    user_id = "test-langchain-user"
    db.clear_all_data(user_id=user_id)
    
    session_math = "session-math-101"
    session_cs = "session-cs-202"
    
    mem_math = LangChainSessionMemory(session_id=session_math, user_id=user_id)
    mem_cs = LangChainSessionMemory(session_id=session_cs, user_id=user_id)
    
    # Add messages
    u_msg = mem_math.add_user_message("Need a plan for Linear Algebra 60m")
    assert isinstance(u_msg, HumanMessage)
    assert u_msg.content == "Need a plan for Linear Algebra 60m"
    
    ai_msg = mem_math.add_assistant_message(
        "Here is your 60m plan for Linear Algebra",
        traces=[{"tool": "plan", "output": "ok"}],
        active_agent="Cognitive Architect"
    )
    assert isinstance(ai_msg, AIMessage)
    assert "Linear Algebra" in ai_msg.content
    assert ai_msg.additional_kwargs.get("active_agent") == "Cognitive Architect"
    
    sys_msg = mem_math.add_system_message("Circadian chronotype set to morning")
    assert isinstance(sys_msg, SystemMessage)
    
    # Add to CS session
    mem_cs.add_user_message("Starting Operating Systems kernel code")
    mem_cs.add_assistant_message("Focus timer started for 25 minutes", active_agent="Focus Specialist")
    
    # Verify Session Isolation
    math_models = mem_math.to_models()
    cs_models = mem_cs.to_models()
    
    assert len(math_models) == 3
    assert len(cs_models) == 2
    
    assert math_models[0].type == "human"
    assert math_models[1].type == "ai"
    assert math_models[2].type == "system"
    
    assert "Linear Algebra" in math_models[0].content
    assert "Operating Systems" in cs_models[0].content
    
    # Verify persistent reloading with LangChain types
    reloaded_math = LangChainSessionMemory(session_id=session_math, user_id=user_id)
    langchain_msgs = reloaded_math.get_langchain_messages()
    assert len(langchain_msgs) == 3
    assert isinstance(langchain_msgs[0], HumanMessage)
    assert isinstance(langchain_msgs[1], AIMessage)
    assert isinstance(langchain_msgs[2], SystemMessage)
    
    # Verify session clearing
    reloaded_math.clear()
    assert len(reloaded_math.get_langchain_messages()) == 0
    
    # CS session remains untouched
    reloaded_cs = LangChainSessionMemory(session_id=session_cs, user_id=user_id)
    assert len(reloaded_cs.get_langchain_messages()) == 2
    
    db.clear_all_data(user_id=user_id)

def test_agent_plan_act_loop():
    user_id = "test-agent-user"
    session_id = f"{user_id}-session"
    db.clear_all_data(user_id=user_id)
    
    # 1a. Cognitive Architect routing for psychological plan & schedule tables
    conv1 = LangChainSessionMemory(session_id=f"{user_id}-plan", user_id=user_id)
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
    assert fb_res1.session_id == f"{user_id}-plan"
    assert "|" in fb_res1.reply
    assert "study_table_markdown" in json.dumps(fb_res1.traces[0].output) or "|" in fb_res1.reply

    # 1b. Schedule Intake Profiling
    conv_sched = LangChainSessionMemory(session_id=f"{user_id}-sched", user_id=user_id)
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
    conv2 = LangChainSessionMemory(session_id=f"{user_id}-log", user_id=user_id)
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
    conv3 = LangChainSessionMemory(session_id=f"{user_id}-analytics", user_id=user_id)
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
    conv4 = LangChainSessionMemory(session_id=f"{user_id}-start", user_id=user_id)
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

    # Test 2: Isolated memory retention with LangChain message models
    memory = LangChainSessionMemory(f"{user_id}-plan", user_id=user_id)
    assert len(memory.get_langchain_messages()) >= 2
    
    # Test 3: Live Agent Runner
    res_live = agent_runner.run_agentic_loop("Hi, what should I study today?", session_id=session_id, user_id=user_id)
    assert len(res_live.reply) > 0
    assert res_live.active_agent is not None
    assert res_live.session_id == session_id
    
    db.clear_all_data(user_id=user_id)

if __name__ == "__main__":
    print("1/4 Running Tools tests...")
    test_tools()
    print("2/4 Running Multi-User Data Isolation tests...")
    test_multi_user_data_isolation()
    print("3/4 Running LangChain Core Session Management tests...")
    test_langchain_session_management()
    print("4/4 Running Agent Swarm & Orchestration tests...")
    test_agent_plan_act_loop()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")
