#  SummaRise – AI Meeting Assistant

SummaRise is an AI-powered meeting assistant that records meetings, transcribes conversations, and generates structured meeting insights using AI.

It supports recording from either your microphone or a browser tab (Google Meet, Zoom Web, Microsoft Teams Web, YouTube, etc.), making it useful for online meetings, interviews, and discussions.

---

##  Features

-  Microphone Recording
-  Browser Tab Audio Recording
-  Automatic Speech-to-Text using Whisper
-  AI Meeting Summary using Google Gemini
-  Discussion Points Extraction
-  Action Items Detection
-  Task Assignment Extraction
-  Full Meeting Transcript
-  Live Recording Timer
-  Responsive Dashboard UI

---

##  Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios

### Backend

- FastAPI
- Python
- Uvicorn

### AI

- OpenAI Whisper (Local)
- Google Gemini

### Browser APIs

- MediaRecorder API
- getUserMedia()
- getDisplayMedia()

---

##  Folder Structure

```
SUMMARISE-AI
│
├── backend
│   ├── app
│   │   ├── routes
│   │   ├── services
│   │   └── main.py
│   │
│   ├── uploads
│   ├── requirements.txt
│   └── .env.example
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── hooks
│   │   ├── pages
│   │   └── services
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

##  Installation

### Clone the repository

```bash
git clone https://https://github.com/Satwik786/summarise-ai.git
cd summarise-ai
```

---

### Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file inside the backend folder.

Example:

```env
GEMINI_API_KEY=your_api_key

UPLOAD_DIR=uploads

MAX_AUDIO_SIZE_MB=100
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

##  Usage

1. Start the FastAPI backend.
2. Start the React frontend.
3. Open the dashboard.
4. Select **Microphone** or **Browser Tab** recording.
5. Record your meeting.
6. Stop recording.
7. Wait for transcription and AI analysis.
8. View:

- Summary
- Discussion Points
- Action Items
- Task Assignments
- Transcript

---

##  License

This project is licensed under the MIT License.

---

##  Author

**Satwik Rai**

GitHub: https://github.com/Satwik786