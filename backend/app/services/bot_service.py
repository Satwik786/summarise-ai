from pathlib import Path

from playwright.sync_api import sync_playwright


class BotService:
    def __init__(self):
        self.playwright = None
        self.context = None
        self.page = None

        self.profile_dir = Path(__file__).resolve().parents[2] / "bot_profile"

        self.extension_dir = (
            Path(__file__).resolve().parents[2] / "bot_extension"
        )

        

    def open_meeting(self, meeting_url: str):
        if not meeting_url.startswith("https://meet.google.com/"):
            raise ValueError("Invalid Google Meet URL")

        # Prevent multiple browser instances for now
        if self.context:
            raise RuntimeError("Bot browser is already running")

        self.playwright = sync_playwright().start()

        self.context = self.playwright.chromium.launch_persistent_context(
            user_data_dir=str(self.profile_dir),
            channel="chromium",
            headless=False,
            permissions=["microphone", "camera"],
            viewport=None,
            args=[
                "--start-maximized",
                f"--disable-extensions-except={self.extension_dir}",
                f"--load-extension={self.extension_dir}",
            ],
        )

        service_workers = self.context.service_workers

        if service_workers:
            worker = service_workers[0]
        else:
            worker = self.context.wait_for_event(
                "serviceworker",
                timeout=10000,
            )

        self.extension_id = worker.url.split("/")[2]

        print("SUMMARISE EXTENSION LOADED")
        print("EXTENSION ID:", self.extension_id)

        # Persistent contexts may already contain a blank page
        if self.context.pages:
            self.page = self.context.pages[0]
        else:
            self.page = self.context.new_page()

        self.page.goto(
            meeting_url,
            wait_until="domcontentloaded",
        )

        # Wait for the Google Meet pre-join screen
        self.page.get_by_text(
            "Ready to join?",
            exact=True,
        ).first.wait_for(
            state="visible",
            timeout=30000,
        )

        print("PRE-JOIN SCREEN FOUND")


        # Try microphone
        try:
            mic_button = self.page.get_by_role(
                "button",
                name="Turn off microphone",
            )

            print("MIC BUTTON COUNT:", mic_button.count())

            if mic_button.count() > 0:
                mic_button.first.click()
                print("MIC TURNED OFF")

        except Exception as error:
            print("MIC ERROR:", repr(error))


        # Try camera
        try:
            camera_button = self.page.get_by_role(
                "button",
                name="Turn off camera",
            )

            print("CAMERA BUTTON COUNT:", camera_button.count())

            if camera_button.count() > 0:
                camera_button.first.click()
                print("CAMERA TURNED OFF")

        except Exception as error:
            print("CAMERA ERROR:", repr(error))


        # Try joining the meeting
        try:
            ask_button = self.page.get_by_role(
                "button",
                name="Ask to join",
            )

            join_button = self.page.get_by_role(
                "button",
                name="Join now",
            )

            print("ASK BUTTON COUNT:", ask_button.count())
            print("JOIN BUTTON COUNT:", join_button.count())

            if ask_button.count() > 0:
                ask_button.first.click()
                print("ASK TO JOIN CLICKED")

            elif join_button.count() > 0:
                join_button.first.click()
                print("JOIN NOW CLICKED")

            else:
                print("NO JOIN BUTTON FOUND")

        except Exception as error:
            print("JOIN ERROR:", repr(error))

        return {
        "success": True,
        "message": "SummaRise bot requested to join the meeting",
    }


bot_service = BotService()