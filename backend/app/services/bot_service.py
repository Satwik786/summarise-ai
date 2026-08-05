from pathlib import Path

from playwright.sync_api import sync_playwright


class BotService:
    def __init__(self):
        self.playwright = None
        self.context = None
        self.page = None
        self.extension_id = None
        self.extension_worker = None

        self.profile_dir = (
            Path(__file__).resolve().parents[2]
            / "bot_profile"
        )

        self.extension_dir = (
            Path(__file__).resolve().parents[2]
            / "bot_extension"
        )


    # Open Google Meet

    def open_meeting(
        self,
        meeting_url: str
    ):
        if not meeting_url.startswith(
            "https://meet.google.com/"
        ):
            raise ValueError(
                "Invalid Google Meet URL"
            )

        # Prevent multiple bot browsers
        if self.context:
            raise RuntimeError(
                "Bot browser is already running"
            )

        self.playwright = (
            sync_playwright().start()
        )

        self.context = (
            self.playwright.chromium
            .launch_persistent_context(
                user_data_dir=str(
                    self.profile_dir
                ),

                channel="chromium",

                headless=False,

                permissions=[
                    "microphone",
                    "camera"
                ],

                viewport=None,

                args=[
                    "--start-maximized",

                    (
                        "--disable-extensions-except="
                        f"{self.extension_dir}"
                    ),

                    (
                        "--load-extension="
                        f"{self.extension_dir}"
                    ),
                ],
            )
        )


        
        # Find SummaRise extension service worker
        

        service_workers = (
            self.context.service_workers
        )

        extension_worker = None

        for worker in service_workers:
            if worker.url.startswith(
                "chrome-extension://"
            ):
                extension_worker = worker
                break

        if not extension_worker:
            try:
                extension_worker = (
                    self.context.wait_for_event(
                        "serviceworker",
                        timeout=10000,
                    )
                )

            except Exception as error:
                raise RuntimeError(
                    "SummaRise extension "
                    "service worker did not load"
                ) from error


        if not extension_worker.url.startswith(
            "chrome-extension://"
        ):
            raise RuntimeError(
                "Loaded service worker is not "
                "the SummaRise extension"
            )


        self.extension_id = (
            extension_worker.url.split("/")[2]
        )

        self.extension_worker = extension_worker

        print(
            "SUMMARISE EXTENSION LOADED"
        )

        print(
            "EXTENSION ID:",
            self.extension_id
        )


        
        # Get/create browser page
        

        if self.context.pages:
            self.page = (
                self.context.pages[0]
            )
        else:
            self.page = (
                self.context.new_page()
            )


        
        # Open Meet
        

        self.page.goto(
            meeting_url,
            wait_until="domcontentloaded",
        )

        print("CURRENT URL:", self.page.url)

        self.page.screenshot(
            path="meet_debug_after_login.png",
            full_page=True,
        )

        print("SCREENSHOT SAVED AFTER LOGIN")


        
        # Wait for pre-join screen
        

        print("WAITING 30 SECONDS...")
        self.page.wait_for_timeout(30000)

        self.page.screenshot(
            path="after_30_seconds.png",
            full_page=True,
        )

        print("TITLE:", self.page.title())

        print("URL:", self.page.url)

        print("========== PAGE TEXT ==========")
        print(self.page.locator("body").inner_text())
        print("========== END ==========")

        raise RuntimeError("DEBUG PAGE")

        print(
            "PRE-JOIN SCREEN FOUND"
        )        

        # Ensure microphone is off

        try:
            mic_off_button = self.page.get_by_role(
                "button",
                name="Turn off microphone",
            )

            mic_on_button = self.page.get_by_role(
                "button",
                name="Turn on microphone",
            )

            if mic_off_button.count() > 0:
                print("MICROPHONE IS ON - TURNING OFF")

                mic_off_button.first.click()

            try:
                mic_on_button.first.wait_for(
                    state="visible",
                    timeout=5000,
                )

            except Exception:
                # Google Meet may re-render the control,
                # so check once more before failing.

                if mic_off_button.count() > 0:
                    print(
                        "MICROPHONE STILL ON - RETRYING"
                    )

                    mic_off_button.first.click()

                mic_on_button.first.wait_for(
                    state="visible",
                    timeout=5000,
                )

            print("MICROPHONE VERIFIED OFF")

        except Exception as error:
            print(
                "MICROPHONE OFF VERIFICATION FAILED:",
                repr(error)
            )

            raise RuntimeError(
                "Unable to verify bot microphone is off"
            ) from error


        # Ensure camera is off

        try:
            camera_off_button = self.page.get_by_role(
                "button",
                name="Turn off camera",
            )

            camera_on_button = self.page.get_by_role(
                "button",
                name="Turn on camera",
            )

            if camera_off_button.count() > 0:
                print("CAMERA IS ON - TURNING OFF")

                camera_off_button.first.click()

            try:
                camera_on_button.first.wait_for(
                    state="visible",
                    timeout=5000,
                )

            except Exception:
                # Google Meet may re-render the control,
                # so check once more before failing.

                if camera_off_button.count() > 0:
                    print(
                        "CAMERA STILL ON - RETRYING"
                    )

                    camera_off_button.first.click()

                camera_on_button.first.wait_for(
                    state="visible",
                    timeout=5000,
                )

            print("CAMERA VERIFIED OFF")

        except Exception as error:
            print(
                "CAMERA OFF VERIFICATION FAILED:",
                repr(error)
            )

            raise RuntimeError(
                "Unable to verify bot camera is off"
            ) from error

        
        # Ask to join / Join now
        

        try:
            ask_button = (
                self.page.get_by_role(
                    "button",
                    name="Ask to join",
                )
            )

            join_button = (
                self.page.get_by_role(
                    "button",
                    name="Join now",
                )
            )

            print(
                "ASK BUTTON COUNT:",
                ask_button.count()
            )

            print(
                "JOIN BUTTON COUNT:",
                join_button.count()
            )


            if ask_button.count() > 0:
                ask_button.first.click()

                print(
                    "ASK TO JOIN CLICKED"
                )

            elif join_button.count() > 0:
                join_button.first.click()

                print(
                    "JOIN NOW CLICKED"
                )

            else:
                print(
                    "NO JOIN BUTTON FOUND"
                )

        except Exception as error:
            print(
                "JOIN ERROR:",
                repr(error)
            )

            # Wait until bot enters the meeting
        

        try:
            print(
                "WAITING FOR BOT TO ENTER MEETING"
            )

            leave_button = (
                self.page.get_by_role(
                    "button",
                    name="Leave call",
                )
            )

            leave_button.first.wait_for(
                state="visible",
                timeout=120000,
            )

            print(
                "BOT ENTERED MEETING"
            )

            # Mute bot Meet speaker output

            try:
                mute_result = (
                    self.extension_worker.evaluate(
                        """
                        async () => {
                            const tabs =
                                await chrome.tabs.query({
                                    url: "https://meet.google.com/*"
                                });

                            if (!tabs.length) {
                                return {
                                    success: false,
                                    error: "Meet tab not found"
                                };
                            }

                            const meetTab = tabs[0];

                            await chrome.tabs.update(
                                meetTab.id,
                                {
                                    muted: true
                                }
                            );

                            return {
                                success: true,
                                tabId: meetTab.id
                            };
                        }
                        """
                    )
                )

                print(
                    "BOT MEET TAB MUTE RESULT:",
                    mute_result
                )

            except Exception as error:
                print(
                    "BOT MEET TAB MUTE ERROR:",
                    repr(error)
                )

        except Exception as error:
            print(
                "MEETING ENTRY DETECTION ERROR:",
                repr(error)
            )


        return {
            "success": True,
            "message":
                "SummaRise bot entered "
                "the meeting",
        }

    # Close bot browser

    def close_bot(self):
        print(
            "CLOSING SUMMARISE BOT"
        )

        if self.context:
            try:
                self.context.close()

                print(
                    "BOT BROWSER CLOSED"
                )

            except Exception as error:
                print(
                    "BOT BROWSER CLOSE ERROR:",
                    repr(error)
                )

        if self.playwright:
            try:
                self.playwright.stop()

                print(
                    "PLAYWRIGHT STOPPED"
                )

            except Exception as error:
                print(
                    "PLAYWRIGHT STOP ERROR:",
                    repr(error)
                )

        # Reset bot state so another
        # meeting can be launched.

        self.context = None
        self.page = None
        self.playwright = None
        self.extension_id = None
        self.extension_worker = None

        print(
            "BOT STATE RESET"
        )

    


bot_service = BotService()