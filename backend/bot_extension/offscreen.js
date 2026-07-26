console.log("SUMMARISE OFFSCREEN DOCUMENT LOADED");


chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    console.log(
      "OFFSCREEN RECEIVED MESSAGE:",
      message
    );


    if (message.type === "PING_OFFSCREEN") {

      console.log("OFFSCREEN PING RECEIVED");

      sendResponse({
        success: true,
        message: "Offscreen document is alive"
      });

      return;
    }
  }
);