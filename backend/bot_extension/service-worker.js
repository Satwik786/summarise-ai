console.log("SummaRise Recorder service worker loaded");

chrome.action.onClicked.addListener((tab) => {
  console.log("EXTENSION CLICKED");
  console.log("ACTIVE TAB:", tab?.url);
  console.log("TAB ID:", tab?.id);

  if (
    !tab?.id ||
    !tab?.url?.startsWith("https://meet.google.com/")
  ) {
    console.error("Active tab is not Google Meet");
    return;
  }

  const meetTabId = tab.id;

  console.log("REQUESTING MEET AUDIO STREAM");

  chrome.tabCapture.getMediaStreamId(
    {
      targetTabId: meetTabId,
    },
    (streamId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "TAB CAPTURE ERROR:",
          chrome.runtime.lastError.message
        );
        return;
      }

      if (!streamId) {
        console.error("No stream ID returned");
        return;
      }

      console.log("STREAM ID RECEIVED");

      const recorderUrl =
        chrome.runtime.getURL("recorder.html") +
        "?streamId=" +
        encodeURIComponent(streamId);

      chrome.windows.create(
        {
          url: recorderUrl,
          type: "popup",

          width: 260,
          height: 140,

          left: 10,
          top: 10,

          focused: false,
        },
        (window) => {
          if (chrome.runtime.lastError) {
            console.error(
              "RECORDER WINDOW ERROR:",
              chrome.runtime.lastError.message
            );
            return;
          }

          console.log("SUMMARISE RECORDER STARTED");
          console.log(
            "RECORDER WINDOW ID:",
            window?.id
          );

          // ------------------------------------------
          // Force recorder popup to compact dimensions
          // ------------------------------------------

          if (window?.id) {
            chrome.windows.update(
              window.id,
              {
                state: "normal",
                width: 260,
                height: 140,
                left: 10,
                top: 10,
                focused: false,
              },
              (updatedWindow) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "RECORDER WINDOW RESIZE ERROR:",
                    chrome.runtime.lastError.message
                  );
                  return;
                }

                console.log(
                  "RECORDER WINDOW SIZE:",
                  updatedWindow?.width,
                  "x",
                  updatedWindow?.height
                );
              }
            );
          }

          // Mute only the Google Meet tab's speaker output.
          // The recorder has already received its capture stream ID.
          chrome.tabs.update(
            meetTabId,
            {
              muted: true,
            },
            (updatedTab) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "MEET TAB MUTE ERROR:",
                  chrome.runtime.lastError.message
                );
                return;
              }

              console.log(
                "BOT MEET TAB MUTED:",
                updatedTab?.mutedInfo?.muted
              );
            }
          );
        }
      );
    }
  );
});