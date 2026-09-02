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
        self._supabase_failures = 0
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
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                raw = resp.read().decode("utf-8")
                self._supabase_failures = 0
                return json.loads(raw) if raw else []
        except Exception as e:
            self._supabase_failures += 1
            if self._supabase_failures > 3:
                logger.info("Supabase remote endpoint unavailable or unmigrated; switching to local SQLite fallback engine.")
                self.use_supabase = False
            return None

    def init_sqlite(self):
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS study_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'default-student',
                topic TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL,
                focus_rating INTEGER NOT NULL DEFAULT 4,
                notes TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_goals (
                user_id TEXT NOT NULL DEFAULT 'default-student',
                date TEXT NOT NULL,
                target_minutes INTEGER NOT NULL DEFAULT 120,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (user_id, date)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS agent_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL DEFAULT 'default-student',
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                tool_calls TEXT DEFAULT '[]',
                created_at TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_schedules (
                user_id TEXT PRIMARY KEY,
                name TEXT DEFAULT 'Student',
                wake_time TEXT DEFAULT '07:00',
                sleep_time TEXT DEFAULT '23:00',
                peak_energy_window TEXT DEFAULT 'morning',
                fixed_commitments TEXT DEFAULT '',
                target_exam_or_goal TEXT DEFAULT '',
                preferred_pomodoro_length INTEGER DEFAULT 25,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Schema migration for existing tables missing user_id column
        for table in ["study_sessions", "agent_memory", "daily_goals"]:
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [col[1] for col in cursor.fetchall()]
            if "user_id" not in cols:
                try:
                    if table == "daily_goals":
                        cursor.execute("ALTER TABLE daily_goals ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default-student'")
                    else:
                        cursor.execute(f"ALTER TABLE {table} ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default-student'")
                except Exception as e:
                    logger.debug(f"Migration notice for {table}: {e}")

        conn.commit()
        conn.close()

    # ==========================================
    # STUDY SESSIONS (USER ISOLATED)
    # ==========================================

    def save_session(
        self,
        topic: str,
        duration_minutes: int,
        focus_rating: int = 4,
        notes: str = "",
        user_id: str = "default-student"
    ) -> Dict[str, Any]:
        now_iso = datetime.now().isoformat()
        
        if self.use_supabase:
            res = self._supabase_request("study_sessions", method="POST", data={
                "user_id": user_id,
                "topic": topic,
                "duration_minutes": duration_minutes,
                "focus_rating": focus_rating,
                "notes": notes,
                "created_at": now_iso
            })
            if res and len(res) > 0:
                self._save_session_sqlite(topic, duration_minutes, focus_rating, notes, now_iso, user_id)
                return res[0]
                
        return self._save_session_sqlite(topic, duration_minutes, focus_rating, notes, now_iso, user_id)

    def _save_session_sqlite(
        self,
        topic: str,
        duration_minutes: int,
        focus_rating: int,
        notes: str,
        now_iso: str,
        user_id: str
    ) -> Dict[str, Any]:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO study_sessions (user_id, topic, duration_minutes, focus_rating, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, topic, duration_minutes, focus_rating, notes, now_iso)
        )
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return {
            "id": session_id,
            "user_id": user_id,
            "topic": topic,
            "duration_minutes": duration_minutes,
            "focus_rating": focus_rating,
            "notes": notes,
            "created_at": now_iso
        }

    def get_sessions(self, user_id: str = "default-student", target_date: Optional[str] = None) -> List[Dict[str, Any]]:
        if not target_date:
            target_date = date.today().isoformat()
            
        if self.use_supabase:
            res = self._supabase_request(
                f"study_sessions?user_id=eq.{urllib.parse.quote(user_id)}&created_at=gte.{target_date}T00:00:00&created_at=lte.{target_date}T23:59:59&order=created_at.desc"
            )
            if res is not None and isinstance(res, list):
                return res

        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM study_sessions WHERE user_id = ? AND created_at LIKE ? ORDER BY created_at DESC",
            (user_id, f"{target_date}%")
        )
        rows = cursor.fetchall()
        sessions = [dict(row) for row in rows]
        conn.close()
        return sessions

    # ==========================================
    # DAILY GOALS (USER ISOLATED)
    # ==========================================

    def set_daily_goal(
        self,
        target_minutes: int,
        user_id: str = "default-student",
        target_date: Optional[str] = None
    ) -> Dict[str, Any]:
        if not target_date:
            target_date = date.today().isoformat()
        now_iso = datetime.now().isoformat()

        if self.use_supabase:
            headers = self._supabase_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/daily_goals",
                data=json.dumps({
                    "user_id": user_id,
                    "date": target_date,
                    "target_minutes": target_minutes,
                    "updated_at": now_iso
                }).encode("utf-8"),
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
            "INSERT INTO daily_goals (user_id, date, target_minutes, updated_at) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(user_id, date) DO UPDATE SET target_minutes=excluded.target_minutes, updated_at=excluded.updated_at",
            (user_id, target_date, target_minutes, now_iso)
        )
        conn.commit()
        conn.close()
        
        return {"user_id": user_id, "date": target_date, "target_minutes": target_minutes}

    def get_daily_goal(self, user_id: str = "default-student", target_date: Optional[str] = None) -> int:
        if not target_date:
            target_date = date.today().isoformat()

        if self.use_supabase:
            res = self._supabase_request(
                f"daily_goals?user_id=eq.{urllib.parse.quote(user_id)}&date=eq.{target_date}&select=target_minutes"
            )
            if res and len(res) > 0:
                return res[0]["target_minutes"]

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT target_minutes FROM daily_goals WHERE user_id = ? AND date = ?", (user_id, target_date))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else 120

    # ==========================================
    # USER SCHEDULE PROFILE (PERSONAL INTAKE)
    # ==========================================

    def save_user_schedule(self, user_id: str, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        now_iso = datetime.now().isoformat()
        name = schedule_data.get("name", "Student")
        wake_time = schedule_data.get("wake_time", "07:00")
        sleep_time = schedule_data.get("sleep_time", "23:00")
        peak_energy = schedule_data.get("peak_energy_window", "morning")
        commitments = schedule_data.get("fixed_commitments", "")
        target_goal = schedule_data.get("target_exam_or_goal", "")
        pomo_len = schedule_data.get("preferred_pomodoro_length", 25)

        if self.use_supabase:
            headers = self._supabase_headers()
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/user_schedules",
                data=json.dumps({
                    "user_id": user_id,
                    "name": name,
                    "wake_time": wake_time,
                    "sleep_time": sleep_time,
                    "peak_energy_window": peak_energy,
                    "fixed_commitments": commitments,
                    "target_exam_or_goal": target_goal,
                    "preferred_pomodoro_length": pomo_len,
                    "updated_at": now_iso
                }).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=5) as resp:
                    pass
            except Exception as e:
                logger.warning(f"Save user schedule request error: {e}")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_schedules (
                user_id, name, wake_time, sleep_time, peak_energy_window,
                fixed_commitments, target_exam_or_goal, preferred_pomodoro_length, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name=excluded.name,
                wake_time=excluded.wake_time,
                sleep_time=excluded.sleep_time,
                peak_energy_window=excluded.peak_energy_window,
                fixed_commitments=excluded.fixed_commitments,
                target_exam_or_goal=excluded.target_exam_or_goal,
                preferred_pomodoro_length=excluded.preferred_pomodoro_length,
                updated_at=excluded.updated_at
        """, (user_id, name, wake_time, sleep_time, peak_energy, commitments, target_goal, pomo_len, now_iso))
        conn.commit()
        conn.close()

        return self.get_user_schedule(user_id)

    def get_user_schedule(self, user_id: str = "default-student") -> Dict[str, Any]:
        if self.use_supabase:
            res = self._supabase_request(f"user_schedules?user_id=eq.{urllib.parse.quote(user_id)}")
            if res and len(res) > 0:
                return res[0]

        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_schedules WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return dict(row)
        return {
            "user_id": user_id,
            "name": "Student",
            "wake_time": "07:00",
            "sleep_time": "23:00",
            "peak_energy_window": "morning",
            "fixed_commitments": "",
            "target_exam_or_goal": "",
            "preferred_pomodoro_length": 25,
            "updated_at": datetime.now().isoformat()
        }

    # ==========================================
    # DAILY SUMMARY & STREAK (USER ISOLATED)
    # ==========================================

    def get_daily_summary(self, user_id: str = "default-student", target_date: Optional[str] = None) -> Dict[str, Any]:
        if not target_date:
            target_date = date.today().isoformat()
            
        sessions = self.get_sessions(user_id, target_date)
        total_minutes = sum(s.get("duration_minutes", 0) for s in sessions)
        sessions_count = len(sessions)
        target_minutes = self.get_daily_goal(user_id, target_date)
        percentage = round((total_minutes / target_minutes) * 100, 1) if target_minutes > 0 else 0
        
        streak = self.compute_streak(user_id)
        user_profile = self.get_user_schedule(user_id)

        return {
            "user_id": user_id,
            "date": target_date,
            "completed_minutes": total_minutes,
            "target_minutes": target_minutes,
            "sessions_count": sessions_count,
            "completion_percentage": min(percentage, 100.0),
            "goal_reached": total_minutes >= target_minutes,
            "streak_days": streak,
            "recent_sessions": sessions[:5],
            "user_profile": user_profile
        }

    def compute_streak(self, user_id: str = "default-student") -> int:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DISTINCT substr(created_at, 1, 10) as session_date 
            FROM study_sessions 
            WHERE user_id = ?
            ORDER BY session_date DESC
        """, (user_id,))
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

    # ==========================================
    # AGENT MEMORY (USER & SESSION ISOLATED)
    # ==========================================

    def save_memory(
        self,
        session_id: str,
        role: str,
        content: str,
        tool_calls: Optional[List] = None,
        user_id: str = "default-student"
    ):
        now_iso = datetime.now().isoformat()
        tool_calls_str = json.dumps(tool_calls or [])
        
        if self.use_supabase:
            self._supabase_request("agent_memory", method="POST", data={
                "user_id": user_id,
                "session_id": session_id,
                "role": role,
                "content": content,
                "tool_calls": tool_calls or [],
                "created_at": now_iso
            })
        
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO agent_memory (user_id, session_id, role, content, tool_calls, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, session_id, role, content, tool_calls_str, now_iso)
        )
        conn.commit()
        conn.close()

    def get_memory(self, session_id: str, user_id: str = "default-student", limit: int = 15) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT role, content, tool_calls, created_at FROM agent_memory WHERE user_id = ? AND session_id = ? ORDER BY id DESC LIMIT ?",
            (user_id, session_id, limit)
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

    # ==========================================
    # RESET DATA (USER ISOLATED)
    # ==========================================

    def clear_all_data(self, user_id: str = "default-student") -> bool:
        if self.use_supabase:
            self._supabase_request(f"study_sessions?user_id=eq.{urllib.parse.quote(user_id)}", method="DELETE")
            self._supabase_request(f"daily_goals?user_id=eq.{urllib.parse.quote(user_id)}", method="DELETE")
            self._supabase_request(f"agent_memory?user_id=eq.{urllib.parse.quote(user_id)}", method="DELETE")
            self._supabase_request(f"user_schedules?user_id=eq.{urllib.parse.quote(user_id)}", method="DELETE")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM study_sessions WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM daily_goals WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM agent_memory WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM user_schedules WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        return True

db = DatabaseManager()

