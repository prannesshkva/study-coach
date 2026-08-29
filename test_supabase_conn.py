import urllib.request
import urllib.parse
import json

SUPABASE_URL = "https://lvswuakhgryjrkuebokr.supabase.co"
SUPABASE_KEY = "sb_publishable_5xWfZBklEWhrodNX8khRyg_mt_UFcOC"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

url = f"{SUPABASE_URL}/rest/v1/study_sessions?select=*"
req = urllib.request.Request(url, headers=headers, method="GET")

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("✅ Successfully queried Supabase study_sessions table! Data:", data)
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error connecting: {e}")
