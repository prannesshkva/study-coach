import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from app.routes import router
from app.database import db

app = FastAPI(
    title="Study Coach API",
    description="Study Coach API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Locate frontend static directory
possible_dirs = [
    os.path.join(parent_dir, "static"),
    os.path.join(current_dir, "static"),
    os.path.join(root_dir, "backend", "static"),
    os.path.join(root_dir, "frontend", "dist"),
    os.path.join(parent_dir, "frontend", "dist")
]

static_dir = None
for p in possible_dirs:
    if os.path.exists(p) and os.path.exists(os.path.join(p, "index.html")):
        static_dir = p
        break

if static_dir:
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return {"error": "API route not found"}
        
        file_path = os.path.join(static_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Study Coach Backend is Running", "docs": "/docs", "health": "/api/health"}
else:
    @app.get("/")
    def root():
        return {
            "message": "Study Coach Backend is Running",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

