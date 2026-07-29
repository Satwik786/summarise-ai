import os
import json

from dotenv import load_dotenv
from google import genai


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


class AIService:
    def analyze_meeting(
        self,
        transcript: str
    ):
        prompt = f"""
You are an AI meeting assistant.

Analyze the following meeting transcript.

Return ONLY valid JSON using EXACTLY this structure:

{{
    "summary": "Brief meeting summary",
    "discussion_points": [
        "Discussion point"
    ],
    "action_items": [
        "Action item"
    ],
    "task_assignments": [
        {{
            "person": "Name of the person assigned the task",
            "task": "Task assigned to that person"
        }}
    ]
}}

Rules for task assignments:

- Extract a task assignment when the transcript clearly assigns
  a task to a specific person.
- Use the person's name exactly as it appears in the transcript.
- Store the person's name ONLY in the "person" field.
- Store the assigned work ONLY in the "task" field.
- Do not use alternative keys such as "name", "assignee",
  "assigned_to", "owner", or "responsible_person".
- If multiple people receive different tasks, create a separate
  object for each person.
- Do not invent an assignee when the transcript does not identify one.
- If there are no explicit task assignments, return an empty
  "task_assignments" array.

Example:

Transcript:
"Rahul, please fix the landing page and Suresh, prepare the website audit."

Expected task_assignments:

[
    {{
        "person": "Rahul",
        "task": "Fix the landing page"
    }},
    {{
        "person": "Suresh",
        "task": "Prepare the website audit"
    }}
]

Transcript:

{transcript}
"""

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )

        text = response.text.strip()

        print("=== GEMINI RESPONSE ===")
        print(text)
        print("=======================")

        # Remove markdown code fences if present
        if text.startswith("```"):
            text = (
                text
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )

        return json.loads(text)


ai_service = AIService()