import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


class AIService:
    def analyze_meeting(self, transcript: str):
        prompt = f"""
You are an AI meeting assistant.

Analyze the following meeting transcript.

Return ONLY valid JSON.

{{
    "summary": "",
    "discussion_points": [],
    "action_items": [],
    "task_assignments": []
}}

Transcript:

{transcript}
"""

        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
        )

        print("=== GEMINI RESPONSE ===")
        # print(response)
        print("=======================")

        text = response.text.strip()

        # Remove markdown code fences if present
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()

        return json.loads(text)


ai_service = AIService()