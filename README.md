# SummaRise

## AI Meeting Assistant

SummaRise is an AI-powered meeting assistant that helps turn meetings into structured, actionable insights.

It can automatically join a Google Meet, capture the meeting audio, generate a transcript, and use AI to extract the meeting summary, discussion points, action items, and task assignments.

The application also supports manual recording through a microphone or browser tab.

---

## Features

### AI Google Meet Bot

- Accept a Google Meet URL from the dashboard
- Automatically launch a browser using Playwright/Chromium
- Navigate to the Google Meet pre-join screen
- Turn off the bot's microphone and camera
- Automatically request to join the meeting
- Capture Google Meet audio using a Chrome Extension
- Record the meeting audio
- Stop the recording from the dashboard
- Transcribe the recording using local Whisper
- Analyze the transcript using Google Gemini
- Display structured meeting insights

### Meeting Insights

After processing a meeting, SummaRise generates:

- **AI Summary**
- **Discussion Points**
- **Action Items**
- **Task Assignments**
- **Full Transcript**

Task assignments include the assigned person's name and their corresponding task when the transcript explicitly assigns work to a person.

### Saved Recordings

Previously recorded meetings can be:

- Viewed from the dashboard
- Selected from the saved recordings list
- Re-analyzed using the AI analysis pipeline

### Manual Recording

SummaRise also supports direct browser recording.

Available recording sources:

- Microphone
- Browser Tab

Browser Tab recording can be used with applications such as:

- Google Meet
- Zoom
- Microsoft Teams
- YouTube

---

# Architecture

```text
                         SUMMARISE
                             |
                             v
                  +---------------------+
                  |   React + Vite      |
                  |      Frontend       |
                  |       Vercel        |
                  +----------+----------+
                             |
                             | HTTPS
                             v
                  +---------------------+
                  |  Cloudflare Tunnel  |
                  +----------+----------+
                             |
                             v
                  +---------------------+
                  |    FastAPI Backend  |
                  |    Windows Host     |
                  +----------+----------+
                             |
                +------------+------------+
                |                         |
                v                         v
       +------------------+      +------------------+
       | Playwright +     |      | Manual Recording |
       | Chromium         |      | Browser APIs     |
       +--------+---------+      +--------+---------+
                |                         |
                v                         |
       +------------------+               |
       |   Google Meet    |               |
       +--------+---------+               |
                |                         |
                v                         |
       +------------------+               |
       | Chrome Extension |               |
       |   tabCapture     |               |
       +--------+---------+               |
                |                         |
                +------------+------------+
                             |
                             v
                    +----------------+
                    | Audio / WebM   |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Local Whisper  |
                    | Transcription  |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Google Gemini  |
                    | AI Analysis    |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | Meeting Data   |
                    +-------+--------+
                            |
                            v
                    +----------------+
                    | React Dashboard|
                    +----------------+
```

---

# Technology Stack

## Frontend

- React
- Vite
- Axios
- Tailwind CSS
- Framer Motion
- React Icons

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- python-dotenv
- python-multipart

## AI and Speech

- OpenAI Whisper for local speech-to-text
- Google Gemini for meeting analysis

## Browser Automation

- Playwright
- Chromium
- Google Meet
- Chrome Extension
- Chrome `tabCapture` API
- MediaRecorder API

## Deployment

- Vercel for the frontend
- Cloudflare Tunnel for exposing the local backend

---

# Project Structure

```text
summarise-ai/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── bot.py
│   │   │   └── meeting.py
│   │   │
│   │   └── services/
│   │       ├── ai_service.py
│   │       ├── bot_service.py
│   │       └── speech_service.py
│   │
│   ├── bot_extension/
│   │   ├── manifest.json
│   │   ├── recorder.html
│   │   ├── recorder.js
│   │   └── service-worker.js
│   │
│   ├── uploads/
│   │   └── meeting.webm
│   │
│   ├── .env
│   ├── .env.example
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── meeting/
│   │   │   │   ├── ActionItemsCard.jsx
│   │   │   │   ├── DiscussionCard.jsx
│   │   │   │   ├── SummaryCard.jsx
│   │   │   │   ├── TaskAssignmentsCard.jsx
│   │   │   │   └── TranscriptCard.jsx
│   │   │   │
│   │   │   ├── Button.jsx
│   │   │   ├── DashboardCard.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useMeetingAnalysis.js
│   │   │   └── useRecorder.js
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── project-structure.txt
```

---

# How It Works

## 1. User launches the bot

The user enters a Google Meet URL in the SummaRise dashboard and clicks:

```text
Launch Bot
```

The frontend sends the meeting URL to the FastAPI backend.

---

## 2. Playwright launches the bot

The backend uses Playwright and Chromium to open Google Meet.

The bot:

1. Opens the supplied Meet URL
2. Detects the pre-join screen
3. Turns off the microphone
4. Turns off the camera
5. Requests to join the meeting
6. Waits until the bot enters the meeting

---

## 3. Meeting audio is captured

The project contains a Chrome Extension responsible for capturing the Google Meet tab's audio.

The extension uses Chrome's `tabCapture` API and passes the captured stream to the recorder.

The recorder uses the browser `MediaRecorder` API to generate a WebM recording.

---

## 4. Recording is stopped

The user can click:

```text
End Meeting
```

The backend sends a stop request to the recorder.

The recorder then:

1. Stops the MediaRecorder
2. Creates the final WebM blob
3. Uploads the recording to the backend

---

## 5. Whisper generates the transcript

The backend processes the saved recording using local Whisper.

The audio is converted into a text transcript.

Example:

```text
Hello. Okay, Rahul, can you do the audit report?
Prakash, can you check the landing page?
I have sent you the website link.
```

---

## 6. Gemini analyzes the transcript

The transcript is passed to Google Gemini.

Gemini generates structured meeting information:

```json
{
  "summary": "Brief meeting summary",
  "discussion_points": [
    "Discussion point 1"
  ],
  "action_items": [
    "Action item 1"
  ],
  "task_assignments": [
    {
      "person": "Rahul",
      "task": "Do the audit report"
    }
  ]
}
```

---

## 7. Dashboard displays the results

The frontend displays:

```text
AI Summary

Discussion Points

Action Items

Task Assignments

Transcript
```

---

# Prerequisites

Before running the project, install:

- Python 3.x
- Node.js
- npm
- Google Chrome
- Git
- A Google Gemini API key

The Google Meet bot additionally requires an environment capable of running:

- Playwright
- Chromium
- Chrome Extension
- Browser audio capture

---

# Backend Setup

Navigate to the backend:

```powershell
cd D:\summarise-ai\backend
```

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Start the backend:

```powershell
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

FastAPI Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Environment Variables

Create:

```text
backend/.env
```

Use `.env.example` as the template.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit the actual `.env` file to GitHub.

---

# Frontend Setup

Open a new terminal:

```powershell
cd D:\summarise-ai\frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

The frontend will normally run at:

```text
http://localhost:5173
```

---

# Frontend Environment Variable

For local development, create:

```text
frontend/.env.local
```

Add:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The frontend uses this variable as the backend API URL.

For a deployed environment, it should contain the public backend URL.

Example:

```env
VITE_API_URL=https://your-tunnel.trycloudflare.com
```

Do not commit `.env.local`.

---

# Chrome Extension Setup

The Google Meet bot uses the extension located at:

```text
backend/bot_extension/
```

Open Chrome:

```text
chrome://extensions/
```

Enable:

```text
Developer mode
```

Click:

```text
Load unpacked
```

Select:

```text
backend/bot_extension/
```

The SummaRise extension should then appear in Chrome.

---

# Running Locally

Start the backend:

```powershell
cd D:\summarise-ai\backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

Start the frontend:

```powershell
cd D:\summarise-ai\frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

Make sure the Chrome Extension is loaded before testing the Google Meet bot.

---

# Running Without VS Code

VS Code is not required to run the application.

For the Windows demo/deployment setup, an optional batch file can be used to start the backend and Cloudflare Tunnel.

Example:

```bat
@echo off

start "SummaRise Backend" cmd /k "cd /d D:\summarise-ai\backend && call venv\Scripts\activate && uvicorn main:app --reload"

start "SummaRise Cloudflare" cmd /k ""C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000"

exit
```

Save it as:

```text
start-summarise.bat
```

Double-clicking the file starts:

```text
FastAPI
+
Cloudflare Tunnel
```

The `.bat` file is a local convenience script and does not need to be committed to the repository.

---

# API Endpoints

## Meeting Recording

```http
POST /meeting/start
```

Starts manual recording.

```http
POST /meeting/stop
```

Stops manual recording.

```http
POST /meeting/upload
```

Uploads a recording for processing.

```http
POST /meeting/analyze
```

Analyzes a transcript using AI.

---

## Google Meet Bot

```http
POST /bot/join
```

Starts the Google Meet bot.

```http
POST /bot/stop
```

Requests the bot to stop recording and process the meeting.

```http
GET /bot/result
```

Returns the current bot/processing result.

```http
GET /bot/recordings
```

Returns saved recordings.

```http
POST /bot/recordings/analyze
```

Re-analyzes a saved recording.

---

# Deployment

## Frontend Deployment

The frontend can be deployed using Vercel.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Set the Vercel environment variable:

```text
VITE_API_URL
```

to the public backend URL.

---

# Cloudflare Tunnel

The current deployment uses a Cloudflare Quick Tunnel to expose the local FastAPI backend.

Start it using:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000
```

Cloudflare generates a URL similar to:

```text
https://example-name.trycloudflare.com
```

That URL is then used as:

```text
VITE_API_URL
```

in Vercel.

## Important

The current setup uses a **Cloudflare Quick Tunnel**.

Quick Tunnel URLs can change when the tunnel is restarted.

Therefore, after restarting Cloudflare:

1. Start the backend
2. Start Cloudflare
3. Copy the newly generated tunnel URL
4. Update `VITE_API_URL` in Vercel
5. Redeploy the frontend

The Vercel frontend URL itself does not need to change.

---

# Current Deployment Architecture

The current setup is a hybrid deployment.

The frontend is hosted on Vercel, while the Google Meet bot and backend run on the Windows host.

```text
User
 |
 v
Vercel
 |
 v
Cloudflare Tunnel
 |
 v
Your Windows Machine
 |
 +-- FastAPI
 |
 +-- Playwright
 |
 +-- Chromium
 |
 +-- Chrome Extension
 |
 +-- Whisper
 |
 v
Google Meet
```

This means the Windows machine must remain:

- Powered on
- Connected to the Internet
- Running FastAPI
- Running Cloudflare Tunnel

VS Code does not need to remain open.

---

# Using the Deployed Application

A user only needs the Vercel frontend URL.

Example:

```text
https://summarise-ai-umcg.vercel.app
```

The user can:

1. Open SummaRise.
2. Enter a Google Meet URL.
3. Click **Launch Bot**.
4. The request is sent to the backend through Cloudflare.
5. The bot runs on the configured host machine.
6. The bot joins the meeting.
7. The meeting is recorded.
8. The recording is transcribed.
9. Gemini analyzes the transcript.
10. The generated insights appear in the dashboard.

The user does not need the project's Python environment or source code on their own computer.

---

# Manual Recording Workflow

SummaRise also provides a manual recording option.

The user selects:

```text
Microphone
```

or:

```text
Browser Tab
```

Then clicks:

```text
Start Recording
```

After the meeting:

```text
End Recording
```

The recording is uploaded to the backend and processed through:

```text
Recording
    ↓
Whisper
    ↓
Transcript
    ↓
Gemini
    ↓
Meeting Insights
```

---

# AI Analysis Output

The AI analysis is structured into four main categories:

### Summary

A concise overview of the meeting.

### Discussion Points

Important topics discussed during the meeting.

### Action Items

Tasks or actions that need to be completed.

### Task Assignments

Tasks mapped to specific people when the transcript explicitly assigns them.

Example:

```text
Rahul
→ Do the audit report

Prakash
→ Check the landing page
```

---

# Saved Recordings

Completed recordings are stored by the backend.

The dashboard provides a:

```text
Saved Recordings
```

section where a previous recording can be selected and analyzed again.

---

# Troubleshooting

## Frontend cannot connect to backend

Check the frontend environment variable:

```env
VITE_API_URL=http://127.0.0.1:8000
```

for local development.

For deployment, verify that `VITE_API_URL` points to the currently active Cloudflare Tunnel URL.

---

## Cloudflare Tunnel URL stopped working

Restart the tunnel:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:8000
```

Copy the newly generated URL and update the Vercel environment variable.

---

## Backend does not start

Activate the virtual environment:

```powershell
cd D:\summarise-ai\backend
.\venv\Scripts\activate
```

Then:

```powershell
uvicorn main:app --reload
```

---

## Google Meet bot does not join

Check:

- Backend is running
- Playwright/Chromium is available
- Google Meet URL is valid
- Chrome is available
- Chrome Extension is loaded
- Bot browser profile is available
- The computer has Internet access

---

## Recording does not start

Check:

```text
chrome://extensions/
```

Make sure the SummaRise extension is loaded and enabled.

Also verify that the bot successfully entered the Google Meet before attempting to capture the meeting audio.

---

## Gemini analysis fails

Check that:

```env
GEMINI_API_KEY=your_gemini_api_key
```

is correctly configured in:

```text
backend/.env
```

Then restart the FastAPI backend.

---

# Security

Never commit API keys or other secrets.

Files such as:

```text
backend/.env
frontend/.env.local
```

should remain local and should be included in `.gitignore`.

Use:

```text
.env.example
```

to document required environment variables without exposing secrets.

---

# Project Limitations

The current implementation is an MVP/demo deployment.

The Google Meet bot currently depends on the host machine for:

- Playwright
- Chromium
- Google Meet interaction
- Chrome Extension
- Audio capture
- Local Whisper transcription

The frontend is cloud-hosted, but the bot itself is not running inside Vercel.

The current Cloudflare Quick Tunnel also uses a temporary public hostname, which may change after restarting the tunnel.

---

# Future Improvements

Possible future improvements include:

- Fully cloud-hosted bot infrastructure
- Persistent backend hosting
- Permanent public backend URL
- Automatic Cloudflare startup
- Automatic extension-triggered recording
- Multi-user support
- Multiple simultaneous meetings
- User authentication
- Meeting history
- Database-backed meeting storage
- Cloud recording storage
- Background processing
- Calendar integration
- Support for additional meeting platforms
- Improved bot lifecycle management

---

# End-to-End Workflow

```text
User
 |
 | Google Meet URL
 v
SummaRise Frontend
 |
 | POST /bot/join
 v
FastAPI
 |
 v
Playwright + Chromium
 |
 v
Google Meet
 |
 v
Chrome Extension
 |
 | Audio capture
 v
MediaRecorder
 |
 | WebM
 v
FastAPI
 |
 v
Local Whisper
 |
 | Transcript
 v
Google Gemini
 |
 | Structured analysis
 v
FastAPI
 |
 v
SummaRise Frontend
 |
 +--> Summary
 |
 +--> Discussion Points
 |
 +--> Action Items
 |
 +--> Task Assignments
 |
 +--> Transcript
```

---

# Project Status

SummaRise currently provides an end-to-end meeting intelligence workflow:

```text
Google Meet
     ↓
Automated Browser Bot
     ↓
Meeting Audio Capture
     ↓
Recording
     ↓
Whisper Transcription
     ↓
Gemini AI Analysis
     ↓
Structured Meeting Insights
     ↓
React Dashboard
```

It also supports manual browser/microphone recording and re-analysis of saved recordings.

---

## Author

**Satwik Rai**

BSc Computer Science Graduate

GitHub: https://github.com/Satwik786

Project developed as part of the PropFusion Software Training Program.

