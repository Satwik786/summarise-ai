console.log("SummaRise recorder loaded");

let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let audioContext = null;
let stopPollInterval = null;
let heartbeatInterval = null;

const statusElement =
  document.getElementById("status");

const params =
  new URLSearchParams(
    window.location.search
  );

const streamId =
  params.get("streamId");


function setStatus(message) {
  if (statusElement) {
    statusElement.textContent =
      message;
  }
}

// START RECORDING
async function startRecording() {
  try {
    if (!streamId) {
      throw new Error(
        "No audio stream received"
      );
    }

    setStatus(
      "Connecting to meeting audio..."
    );

    console.log(
      "REQUESTING CAPTURED MEET AUDIO"
    );


    // Capture Google Meet tab audio

    mediaStream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId:
                streamId,
            },
          },

          video: false,
        });


    console.log(
      "MEET AUDIO STREAM OPENED"
    );


    // Keep Meet audio audible

    /* audioContext =
      new AudioContext();


    const source =
      audioContext
        .createMediaStreamSource(
          mediaStream
        );


    source.connect(
      audioContext.destination
    );


    console.log(
      "MEET AUDIO CONNECTED TO SPEAKERS"
    ); */


    // MediaRecorder

    recordedChunks = [];


    let options = {};


    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {
      options = {
        mimeType:
          "audio/webm;codecs=opus",
      };
    }


    mediaRecorder =
      new MediaRecorder(
        mediaStream,
        options
      );


    mediaRecorder.ondataavailable =
      (event) => {

        if (
          event.data &&
          event.data.size > 0
        ) {
          recordedChunks.push(
            event.data
          );
        }

      };


    mediaRecorder.onerror =
      (event) => {

        console.error(
          "MEDIA RECORDER ERROR:",
          event
        );

      };


    mediaRecorder.onstop =
      uploadRecording;


    // Generate chunks every second

    mediaRecorder.start(1000);


    console.log(
      "SUMMARISE RECORDING STARTED"
    );

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/bot/recording-started",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Backend rejected recording start"
        );
      }

      console.log(
        "BACKEND NOTIFIED RECORDING STARTED"
      );

      await sendHeartbeat();

      heartbeatInterval = setInterval(
        sendHeartbeat,
        5000
      );

    } catch (error) {

      console.error(
        "FAILED TO NOTIFY BACKEND:",
        error
      );

    }

    


    setStatus(
      "Recording meeting..."
    );


    // Start checking whether
    // React requested End Meeting

    startStopPolling();

  } catch (error) {

    console.error(
      "START RECORDING FAILED:",
      error
    );

    if (heartbeatInterval) {

    clearInterval(
      heartbeatInterval
    );

    heartbeatInterval = null;

  }


    setStatus(
      `Recording failed: ${error.message}`
    );

  }
}

async function sendHeartbeat() {

  try {

    await fetch(
      "http://127.0.0.1:8000/bot/heartbeat",
      {
        method: "POST",
      }
    );

    console.log(
      "RECORDER HEARTBEAT SENT"
    );

  } catch (error) {

    console.error(
      "HEARTBEAT FAILED:",
      error
    );

  }

}

// STOP RECORDING
function stopRecording() {

  if (
    !mediaRecorder ||
    mediaRecorder.state ===
      "inactive"
  ) {
    console.log(
      "No active recording"
    );

    return;
  }


  console.log(
    "STOPPING RECORDING"
  );


  setStatus(
    "Processing meeting..."
  );


  if (stopPollInterval) {

    clearInterval(
      stopPollInterval
    );

    stopPollInterval = null;

  }

  if (heartbeatInterval) {

    clearInterval(
      heartbeatInterval
    );

    heartbeatInterval = null;

  }


  /*
    IMPORTANT:

    MediaRecorder.stop() must happen
    before we destroy the stream.

    This produces the final
    dataavailable event.
  */

  mediaRecorder.stop();


  mediaStream
    ?.getTracks()
    .forEach((track) => {
      track.stop();
    });
}

// UPLOAD RECORDING
async function uploadRecording() {

  try {

    console.log(
      "PREPARING RECORDING"
    );


    const blob =
      new Blob(
        recordedChunks,
        {
          type:
            "audio/webm",
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


    setStatus(
      "Generating meeting insights..."
    );


    const formData =
      new FormData();


    formData.append(
      "file",
      blob,
      "meeting.webm"
    );


    console.log(
      "UPLOADING TO SUMMARISE API"
    );


    const response =
      await fetch(
        "http://127.0.0.1:8000/bot/recording",
        {
          method: "POST",
          body: formData,
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        `Upload failed (${response.status}): ${errorText}`
      );

    }


    const result =
      await response.json();


    console.log(
      "MEETING PROCESSING COMPLETE:",
      result
    );


    setStatus(
      "Meeting processed successfully"
    );


    /*
      Give the user a moment to see
      completion and then close the
      recorder automatically.
    */

    setTimeout(
      () => {
        window.close();
      },
      1500
    );


  } catch (error) {

    console.error(
      "RECORDING UPLOAD FAILED:",
      error
    );


    setStatus(
      "Unable to process meeting"
    );

  } finally {

    if (heartbeatInterval) {

      clearInterval(
        heartbeatInterval
      );

      heartbeatInterval = null;

    }

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

// POLL BACKEND FOR END MEETING
function startStopPolling() {

  if (stopPollInterval) {

    clearInterval(
      stopPollInterval
    );

  }


  stopPollInterval =
    setInterval(
      async () => {

        try {

          if (
            !mediaRecorder ||
            mediaRecorder.state !==
              "recording"
          ) {
            return;
          }


          const response =
            await fetch(
              "http://127.0.0.1:8000/bot/stop-status"
            );


          if (!response.ok) {
            return;
          }


          const data =
            await response.json();


          if (
            data.stop === true
          ) {

            console.log(
              "REMOTE END MEETING RECEIVED"
            );


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

// START
startRecording();