console.log("SummaRise recorder page loaded");

let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let audioContext = null;

// Get stream ID passed by service-worker.

const params = new URLSearchParams(window.location.search);
const streamId = params.get("streamId");

console.log("STREAM ID RECEIVED:", streamId);
// Start recordi

async function startRecording() {
  try {
    if (!streamId) {
      throw new Error("No stream ID received");
    }

    document.getElementById("status").textContent =
      "Connecting to meeting audio...";

    console.log("Requesting captured Meet audio");


    // Capture Google Meet tab audio
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: false,
    });

    console.log("MEET AUDIO STREAM OPENED");


    // Keep Meet audio audible through speakers

    audioContext = new AudioContext();

    const source =
      audioContext.createMediaStreamSource(mediaStream);

    source.connect(audioContext.destination);

    console.log("MEET AUDIO CONNECTED TO SPEAKERS");


    // Create MediaRecorder

    recordedChunks = [];

    let options = {};

    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {
      options = {
        mimeType: "audio/webm;codecs=opus",
      };
    }

    mediaRecorder = new MediaRecorder(
      mediaStream,
      options
    );


    // Receive audio chunks
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);

        console.log(
          "AUDIO CHUNK:",
          event.data.size,
          "bytes"
        );
      }
    };


    // Called after recorder fully stops
    mediaRecorder.onstop = uploadRecording;


    mediaRecorder.onerror = (event) => {
      console.error(
        "MEDIA RECORDER ERROR:",
        event
      );
    };


    // Generate one chunk every second
    mediaRecorder.start(1000);

    document.getElementById("status").textContent =
      "Recording meeting audio...";

    console.log("RECORDING STARTED");

  } catch (error) {
    console.error(
      "START RECORDING FAILED:",
      error
    );

    document.getElementById("status").textContent =
      `Recording failed: ${error.message}`;
  }
}
// Stop recordi

function stopRecording() {
  if (
    !mediaRecorder ||
    mediaRecorder.state === "inactive"
  ) {
    console.log("No active recording");
    return;
  }

  console.log("STOPPING RECORDING");

  document.getElementById("status").textContent =
    "Processing recording...";


  /*
    Calling stop() causes the final dataavailable event
    and then triggers mediaRecorder.onstop.
  */
  mediaRecorder.stop();


  // Stop captured audio tracks
  mediaStream?.getTracks().forEach((track) => {
    track.stop();
  });
}
// Upload recording to FastA

async function uploadRecording() {
  try {
    console.log("Preparing recording for upload");

    const blob = new Blob(
      recordedChunks,
      {
        type: "audio/webm",
      }
    );

    console.log(
      "FINAL RECORDING SIZE:",
      blob.size,
      "bytes"
    );


    if (blob.size === 0) {
      throw new Error(
        "Recording is empty"
      );
    }


    document.getElementById("status").textContent =
      "Uploading recording...";


    // Create multipart/form-data request
    const formData = new FormData();

    formData.append(
      "file",
      blob,
      "meeting.webm"
    );


    console.log(
      "Uploading recording to FastAPI"
    );


    const response = await fetch(
      "http://127.0.0.1:8000/bot/recording",
      {
        method: "POST",
        body: formData,
      }
    );


    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Upload failed (${response.status}): ${errorText}`
      );
    }


    const result = await response.json();

    console.log(
      "RECORDING UPLOAD SUCCESS:",
      result
    );


    document.getElementById("status").textContent =
      `Recording saved: ${result.filename}`;


  } catch (error) {
    console.error(
      "RECORDING UPLOAD FAILED:",
      error
    );

    document.getElementById("status").textContent =
      `Upload failed: ${error.message}`;

  } finally {
    recordedChunks = [];
    mediaRecorder = null;
    mediaStream = null;

    if (audioContext) {
      try {
        await audioContext.close();
      } catch (error) {
        console.error(
          "AUDIO CONTEXT CLOSE ERROR:",
          error
        );
      }

      audioContext = null;
    }
  }
}


// Make Stop available to recorder-controls.js
window.stopSummaRiseRecording = stopRecording;


// Allow service worker to stop the recorder

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (message.type !== "STOP_RECORDING") {
      return;
    }

    console.log(
      "STOP_RECORDING MESSAGE RECEIVED"
    );

    if (
      !mediaRecorder ||
      mediaRecorder.state === "inactive"
    ) {
      sendResponse({
        success: false,
        message: "No active recording",
      });

      return;
    }

    stopRecording();

    sendResponse({
      success: true,
      message: "Recording stop requested",
    });
  }
);

let stopPollInterval = null;

function startStopPolling() {
  stopPollInterval = setInterval(
    async () => {
      try {
        if (
          !mediaRecorder ||
          mediaRecorder.state !== "recording"
        ) {
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/bot/stop-status"
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (data.stop === true) {
          console.log(
            "REMOTE STOP REQUEST RECEIVED"
          );

          clearInterval(stopPollInterval);
          stopPollInterval = null;

          stopRecording();
        }
      } catch (error) {
        console.error(
          "STOP POLL ERROR:",
          error
        );
      }
    },
    1000
  );
}

// Automatically start when recorder window opens

startRecording();
startStopPolling();