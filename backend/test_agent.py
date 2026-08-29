import os
import sys
import json

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, os.path.dirname(__file__))

from app.database import db
from app.tools import start_session, log_session, set_daily_goal, get_daily_summary, suggest_break_or_session
from app.agent import agent_runner

def test_tools():
    goal_res = set_daily_goal(120)
    assert "120" in goal_res
    
    start_res = start_session(25, "Operating Systems")
    assert "started" in start_res
    
    log_res = log_session(25, 5, "Finished Process Scheduling chapter", "Operating Systems")
    assert "logged_successfully" in log_res
    
    summary_res = get_daily_summary()
    assert "summary" in summary_res
    
    break_res = suggest_break_or_session()
    assert "recommendation" in break_res

def test_agent_plan_act_loop():
    session_id = "test-verification-session"
    
    res1 = agent_runner.run_agentic_loop("Hi, set my study goal for today to 180 minutes.", session_id=session_id)
    assert len(res1.traces) >= 1
    
    res2 = agent_runner.run_agentic_loop("I just completed 25 minutes on Distributed Systems with rating 5! Should I take a break?", session_id=session_id)
    assert len(res2.traces) >= 2

    memory = db.get_memory(session_id)
    assert len(memory) >= 2
    
    db.clear_all_data()

if __name__ == "__main__":
    test_tools()
    test_agent_plan_act_loop()
    print("ALL TESTS PASSED")
