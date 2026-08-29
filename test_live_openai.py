import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.agent import PomodoroAgentRunner

runner = PomodoroAgentRunner()
print(f"Runner initialized with Model: {runner.model}, API Key present: {bool(runner.api_key)}")

resp = runner.run_agentic_loop("Hi! Set my daily focus goal to 150 minutes and tell me what my first study session should be.")

print(resp.reply)
for t in resp.traces:
    print(f"Step {t.step}: {t.tool_name}({t.arguments}) -> {t.output}")
