import os
import sqlite3
import json
import logging
import urllib.request
import urllib.parse
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("pomodoro_db")
logging.basicConfig(level=logging.INFO)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "..", "pomodoro.db"))

class DatabaseManager:
    def __init__(self):
        self.use_supabase = bool(SUPABASE_URL and SUPABASE_KEY)
        self.init_sqlite()

    def _supabase_headers(self) -> Dict[str, str]:
        return {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _supabase_request(self, endpoint: str, method: str = "GET", data: Optional[Any] = None) -> Optional[Any]:
        if not self.use_supabase:
            return None
        url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
        payload = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=payload, headers=self._supabase_headers(), method=method)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw else []
        except Exception as e:
            logger.warning(f"Database request error ({method} {endpoint}): {e}")
            return None

    def init_sqlite(self):
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL,
                focus_rating INTEGER NOT NULL DEFAULT 4,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_goals (
                date TEXT PRIMARY KEY,
                target_minutes INTEGER NOT NULL DEFAULT 120,
                updated_at TEXT NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                tool_calls TEXT DEFAULT '[]',
                created_at TEXT NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()

    def save_session(self, topic: str, duration_minutes: int, focus_rating: int = 4, notes: str = "") -> Dict[str, Any]:
        now_iso = datetime.now().isoformat()
        
        if self.use_supabase:
            res = self._supabase_request("study_sessions", method="POST", data={
                "topic": topic,
                "duration_minutes": duration_minutes,
                "focus_rating": focus_rating,
                "notes": notes,
                "created_at": now_iso
            })
            if res and len(res) > 0:
                self._save_session_sqlite(topic, duration_minutes, focus_rating, notes, now_iso)
                return res[0]
                
        return self._save_session_sqlite(topic, duration_minutes, focus_rating, notes, now_iso)

    def _save_session_sqlite(self, topic: str, duration_minutes: int, focus_rating: int, notes: str, now_iso: str) -> Dict[str, Any]:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO study_sessions (topic, duration_minutes, focus_rating, notes, created_at) VALUES (?, ?, ?, ?, ?)",
            (topic, duration_minutes, focus_rating, notes, now_iso)
        )
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "id": session_id,
            "topic": topic,
            "duration_minutes": duration_minutes,
            "focus_rating": focus_rating,
            "notes": notes,
            "created_at": now_iso
        }

    def get_sessions(self, target_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not target_date:
            target_date = date.today().isoformat()
            
        if self.use_supabase:
            res = self._supabase_request(f"study_sessions?created_at=gte.{target_date}T00:00:00&created_at=lte.{target_date}T23:59:59&order=created_at.desc")
            if res is not None and isinstance(res, list):
                return res

        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM study_sessions WHERE created_at LIKE ? ORDER BY created_at DESC",
            (f"{target_date}%",)
        )
        rows = cursor.fetchall()
        sessions = [dict(row) for row in rows]
        conn.close()
        return sessions

    def set_daily_goal(self, target_minutes: int, target_date: Optional[str] = None) -> Dict[str, Any]:
        if not target_date:
            target_date = date.today().isoformat()
        now_iso = datetime.now().isoformat()

        if self.use_supabase:
            headers = self._supabase_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/daily_goals",
                data=json.dumps({"date": target_date, "target_minutes": target_minutes, "updated_at": now_iso}).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=5) as resp:
                    pass
            except Exception as e:
                logger.warning(f"Set daily goal request error: {e}")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO daily_goals (date, target_minutes, updated_at) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET target_minutes=excluded.target_minutes, updated_at=excluded.updated_at",
            (target_date, target_minutes, now_iso)
        )
        conn.commit()
        conn.close()
        
        return {"date": target_date, "target_minutes": target_minutes}

    def get_daily_goal(self, target_date: Optional[str] = None) -> int:
        if not target_date:
            target_date = date.today().isoformat()

        if self.use_supabase:
            res = self._supabase_request(f"daily_goals?date=eq.{target_date}&select=target_minutes")
            if res and len(res) > 0:
                return res[0]["target_minutes"]

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT target_minutes FROM daily_goals WHERE date = ?", (target_date,))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else 120

    def get_daily_summary(self, target_date: Optional[str] = None) -> Dict[str, Any]:
        if not target_date:
            target_date = date.today().isoformat()
            
        sessions = self.get_sessions(target_date)
        total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
        sessions_count = len(sessions)
        target_minutes = self.get_daily_goal(target_date)
        percentage = round((total_minutes / target_minutes) * 100, 1) if target_minutes > 0 else 0
        
        streak = self.compute_streak()

        return {
            "date": target_date,
            "completed_minutes": total_minutes,
            "target_minutes": target_minutes,
            "sessions_count": sessions_count,
            "completion_percentage": min(percentage, 100.0),
            "goal_reached": total_minutes >= target_minutes,
            "streak_days": streak,
            "recent_sessions": sessions[:5]
        }

    def compute_streak(self) -> int:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT substr(created_at, 1, 10) as session_date 
            FROM study_sessions 
            ORDER BY session_date DESC
        """)
        dates = [r[0] for r in cursor.fetchall()]
        conn.close()
        
        if not dates:
            return 0
            
        today_str = date.today().isoformat()
        streak = 0
        from datetime import timedelta
        
        current_check = date.today()
        if dates[0] != today_str:
            yesterday_str = (current_check - timedelta(days=1)).isoformat()
            if dates[0] == yesterday_str:
                current_check = current_check - timedelta(days=1)
            else:
                return 0

        date_set = set(dates)
        while current_check.isoformat() in date_set:
            streak += 1
            current_check -= timedelta(days=1)
            
        return streak

    def save_memory(self, session_id: str, role: str, content: str, tool_calls: Optional[List] = None):
        now_iso = datetime.now().isoformat()
        tool_calls_str = json.dumps(tool_calls or [])
        
        if self.use_supabase:
            self._supabase_request("agent_memory", method="POST", data={
                "session_id": session_id,
                "role": role,
                "content": content,
                "tool_calls": tool_calls or [],
                "created_at": now_iso
            })
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO agent_memory (session_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, role, content, tool_calls_str, now_iso)
        )
        conn.commit()
        conn.close()

    def get_memory(self, session_id: str, limit: int = 15) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, content, tool_calls, created_at FROM agent_memory WHERE session_id = ? ORDER BY id DESC LIMIT ?",
            (session_id, limit)
        )
        rows = cursor.fetchall()
        conn.close()
        
        messages = []
        for row in reversed(rows):
            item = dict(row)
            try:
                item["tool_calls"] = json.loads(item["tool_calls"])
            except Exception:
                item["tool_calls"] = []
            messages.append(item)
            
        return messages

    def clear_all_data(self) -> bool:
        if self.use_supabase:
            self._supabase_request("study_sessions?id=gte.0", method="DELETE")
            self._supabase_request("daily_goals?target_minutes=gte.0", method="DELETE")
            self._supabase_request("agent_memory?id=gte.0", method="DELETE")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM study_sessions")
        cursor.execute("DELETE FROM daily_goals")
        cursor.execute("DELETE FROM agent_memory")
        conn.commit()
        conn.close()
        return True

db = DatabaseManager()
