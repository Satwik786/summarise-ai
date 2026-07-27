console.log("SummaRise Recorder service worker loaded");

chrome.action.onClicked.addListener((tab) => {
  console.log("EXTENSION CLICKED");
  console.log("ACTIVE TAB:", tab?.url);
  console.log("TAB ID:", tab?.id);

  if (!tab?.id || !tab?.url?.startsWith("https://meet.google.com/")) {
    console.error("Active tab is not Google Meet");
    return;
  }

  console.log("ABOUT TO REQUEST STREAM ID");

  chrome.tabCapture.getMediaStreamId(
    {
      targetTabId: tab.id,
    },
    (streamId) => {
      console.log("TAB CAPTURE CALLBACK FIRED");

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

      console.log("STREAM ID SUCCESS");
      console.log("STREAM ID:", streamId);

      const recorderUrl =
        chrome.runtime.getURL("recorder.html") +
        "?streamId=" +
        encodeURIComponent(streamId);

      console.log("OPENING RECORDER WINDOW");

      chrome.windows.create(
        {
          url: recorderUrl,
          type: "popup",
          width: 420,
          height: 300,
        },
        (window) => {
          if (chrome.runtime.lastError) {
            console.error(
              "WINDOW ERROR:",
              chrome.runtime.lastError.message
            );
            return;
          }

          console.log("RECORDER WINDOW CREATED");
          console.log("WINDOW ID:", window?.id);
        }
      );
    }
  );

  console.log("STREAM ID REQUEST SUBMITTED");
});


// External stop command

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type !== "STOP_BOT_RECORDING") {
      return;
    }

    console.log(
      "STOP BOT RECORDING REQUESTED"
    );

    chrome.runtime.sendMessage(
      {
        type: "STOP_RECORDING",
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "STOP RECORDING ERROR:",
            chrome.runtime.lastError.message
          );

          sendResponse({
            success: false,
            message:
              chrome.runtime.lastError.message,
          });

          return;
        }

        console.log(
          "RECORDER STOP RESPONSE:",
          response
        );

        sendResponse(
          response || {
            success: true,
          }
        );
      }
    );

    return true;
  }
);