import { useRef } from "react";

export default function useRecorder() {
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const stopResolver = useRef(null);

  const startRecording = async (source = "microphone") => {
    let stream;

    if (source === "tab") {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } else {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    }

    mediaStream.current = stream;
    audioChunks.current = [];

    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunks.current, {
        type: "audio/webm",
      });

      mediaStream.current?.getTracks().forEach((track) => track.stop());

      if (stopResolver.current) {
        stopResolver.current(blob);
        stopResolver.current = null;
      }
    };

    // If the user manually clicks Chrome's "Stop sharing"
    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.onended = () => {
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      };
    }

    recorder.start();
    mediaRecorder.current = recorder;
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      stopResolver.current = resolve;

      if (
        mediaRecorder.current &&
        mediaRecorder.current.state !== "inactive"
      ) {
        mediaRecorder.current.stop();
      }
    });
  };

  return {
    startRecording,
    stopRecording,
  };
}