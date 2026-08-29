import urllib.request
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/study_sessions?id=gte.0", headers=headers, method="DELETE")
try:
    with urllib.request.urlopen(req) as resp:
        print("Deleted study_sessions status:", resp.status)
except Exception as e:
    print("Error deleting study_sessions:", e)

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/daily_goals?target_minutes=gte.0", headers=headers, method="DELETE")
try:
    with urllib.request.urlopen(req) as resp:
        print("Deleted daily_goals status:", resp.status)
except Exception as e:
    print("Error deleting daily_goals:", e)

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/agent_memory?id=gte.0", headers=headers, method="DELETE")
try:
    with urllib.request.urlopen(req) as resp:
        print("Deleted agent_memory status:", resp.status)
except Exception as e:
    print("Error deleting agent_memory:", e)

req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/study_sessions?select=*", headers=headers, method="GET")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("Current Supabase study_sessions count:", len(data), data)
