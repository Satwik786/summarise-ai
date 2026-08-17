@echo off

start "SummaRise Backend" cmd /k "cd /d D:\summarise-ai\backend && call venv\Scripts\activate && uvicorn main:app --reload"

start "SummaRise Cloudflare" cmd /k ""C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000"

exit