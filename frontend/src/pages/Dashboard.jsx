import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import DashboardCard from "../components/DashboardCard";
import Button from "../components/Button";

import SummaryCard from "../components/meeting/SummaryCard";
import TranscriptCard from "../components/meeting/TranscriptCard";
import DiscussionCard from "../components/meeting/DiscussionCard";
import ActionItemsCard from "../components/meeting/ActionItemsCard";
import TaskAssignmentsCard from "../components/meeting/TaskAssignmentsCard";

import api from "../services/api";
import useRecorder from "../hooks/useRecorder";
import useMeetingAnalysis from "../hooks/useMeetingAnalysis";


export default function Dashboard() {
  const [status, setStatus] = useState("Ready");
  const [seconds, setSeconds] = useState(0);

  const [recordingSource, setRecordingSource] =
    useState("microphone");

  // Bot state
  const [meetingUrl, setMeetingUrl] = useState("");
  const [botStatus, setBotStatus] = useState("Ready");
  const [botRunning, setBotRunning] = useState(false);

  const recorder = useRecorder();

  const {
    loading,
    loadingStage,

    summary,
    transcript,
    discussionPoints,
    actionItems,
    taskAssignments,

    analyzeMeeting,
    retryAnalysis,
    getBotResult,
  } = useMeetingAnalysis();


  const hasResults =
    transcript ||
    summary ||
    discussionPoints.length > 0 ||
    actionItems.length > 0 ||
    taskAssignments.length > 0;


  // --------------------------------------------------
  // Existing recording timer
  // --------------------------------------------------

  useEffect(() => {
    let interval;

    if (status === "Recording") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);


  // --------------------------------------------------
  // Poll bot result
  // --------------------------------------------------

  useEffect(() => {
    if (!botRunning) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const result = await getBotResult();

        if (result) {
          console.log(
            "BOT RESULT RECEIVED:",
            result
          );

          setBotStatus("Completed");
          setBotRunning(false);
        }
      } catch (error) {
        console.error(
          "BOT RESULT CHECK FAILED:",
          error
        );
      }
    }, 3000);

    return () => clearInterval(interval);

  }, [botRunning]);


  // --------------------------------------------------
  // Format timer
  // --------------------------------------------------

  const formatTime = () => {
    const hrs = String(
      Math.floor(seconds / 3600)
    ).padStart(2, "0");

    const mins = String(
      Math.floor((seconds % 3600) / 60)
    ).padStart(2, "0");

    const secs = String(
      seconds % 60
    ).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };


  // --------------------------------------------------
  // Launch AI bot
  // --------------------------------------------------

  const launchBot = async () => {
    const url = meetingUrl.trim();

    if (!url) {
      alert("Enter a Google Meet URL.");
      return;
    }

    if (
      !url.startsWith(
        "https://meet.google.com/"
      )
    ) {
      alert(
        "Please enter a valid Google Meet URL."
      );

      return;
    }

    try {
      setBotStatus("Launching bot...");

      const response = await api.post(
        "/bot/join",
        {
          meeting_url: url,
        }
      );

      console.log(
        "BOT JOIN RESPONSE:",
        response.data
      );

      setBotStatus(
        "Bot requested to join meeting"
      );

      /*
        Start watching /bot/result.

        Once the extension uploads the recording
        and Whisper + Gemini finish processing,
        React receives the result.
      */
      setBotRunning(true);

    } catch (error) {
      console.error(
        "BOT LAUNCH FAILED:",
        error
      );

      setBotStatus("Launch failed");

      alert(
        error.response?.data?.detail ||
        "Unable to launch SummaRise bot."
      );
    }
  };


  // --------------------------------------------------
  // Existing manual recorder
  // --------------------------------------------------

  const startRecording = async () => {
    try {
      await api.post("/meeting/start");

      await recorder.startRecording(
        recordingSource
      );

      setSeconds(0);
      setStatus("Recording");

    } catch (error) {
      console.error(error);

      if (
        error.name === "NotAllowedError" ||
        error.name === "AbortError"
      ) {
        alert("Recording was cancelled.");
      } else {
        alert(
          "Unable to access the selected recording source."
        );
      }

      setStatus("Ready");
    }
  };


  const stopRecording = async () => {
    try {
      const audioBlob =
        await recorder.stopRecording();

      setStatus("Processing");

      await analyzeMeeting(audioBlob);

      await api.post("/meeting/stop");

      setSeconds(0);
      setStatus("Ready");

    } catch (error) {
      console.error(error);

      alert("Processing failed.");

      setStatus("Ready");
    }
  };


  return (
    <>
      <Navbar status={status} />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">

        {/* ==========================================
            AI MEETING BOT
        ========================================== */}

        <DashboardCard title="SummaRise AI Meeting Bot">
          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Google Meet URL
              </label>

              <input
                type="url"
                value={meetingUrl}
                onChange={(event) =>
                  setMeetingUrl(event.target.value)
                }
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                disabled={botRunning}
                className="
                  w-full
                  rounded-lg
                  border
                  border-zinc-700
                  bg-zinc-900
                  px-4
                  py-3
                  text-zinc-100
                  outline-none
                  transition
                  placeholder:text-zinc-600
                  focus:border-blue-500
                "
              />
            </div>


            <div className="flex flex-wrap items-center gap-4">

              <Button
                onClick={launchBot}
                disabled={
                  botRunning ||
                  !meetingUrl.trim()
                }
              >
                Launch SummaRise Bot
              </Button>


              <div className="text-sm text-zinc-400">
                Bot Status:

                <span
                  className={`ml-2 font-semibold ${
                    botStatus === "Completed"
                      ? "text-emerald-400"
                      : botStatus === "Launch failed"
                      ? "text-red-400"
                      : botRunning
                      ? "text-amber-400"
                      : "text-zinc-300"
                  }`}
                >
                  {botStatus}
                </span>
              </div>

            </div>


            {botRunning && (
              <p className="text-sm text-zinc-500">
                SummaRise is waiting for the meeting
                recording to finish. Results will appear
                automatically after transcription and AI
                analysis complete.
              </p>
            )}

          </div>
        </DashboardCard>


        {/* ==========================================
            MANUAL RECORDING
        ========================================== */}

        <div className="grid gap-6 lg:grid-cols-2">

          <DashboardCard title="Manual Recording">

            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Recording Source
              </label>


              <div className="flex gap-6">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="radio"
                    name="recording-source"
                    value="microphone"
                    checked={
                      recordingSource ===
                      "microphone"
                    }
                    onChange={(event) =>
                      setRecordingSource(
                        event.target.value
                      )
                    }
                    disabled={
                      status === "Recording" ||
                      loading
                    }
                  />

                  <span>Microphone</span>

                </label>


                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="radio"
                    name="recording-source"
                    value="tab"
                    checked={
                      recordingSource === "tab"
                    }
                    onChange={(event) =>
                      setRecordingSource(
                        event.target.value
                      )
                    }
                    disabled={
                      status === "Recording" ||
                      loading
                    }
                  />

                  <span>Browser Tab</span>

                </label>

              </div>


              <p className="mt-3 text-xs text-zinc-500">
                Browser Tab is recommended for
                Google Meet, Zoom, Microsoft Teams
                and YouTube.
              </p>

            </div>


            <div className="flex gap-4">

              <Button
                onClick={startRecording}
                disabled={
                  status === "Recording" ||
                  loading
                }
              >
                Start Recording
              </Button>


              <Button
                variant="danger"
                onClick={stopRecording}
                disabled={
                  status !== "Recording" ||
                  loading
                }
              >
                End Recording
              </Button>

            </div>

          </DashboardCard>


          {/* ========================================
              STATUS
          ======================================== */}

          <DashboardCard title="Recording Status">

            <div className="space-y-3">

              <p className="text-zinc-300">

                Status :

                <span
                  className={`ml-2 font-semibold ${
                    loading
                      ? "text-amber-400"
                      : status === "Recording"
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {loading
                    ? loadingStage
                    : status}
                </span>

              </p>


              <p className="text-5xl font-bold tracking-wider">
                {formatTime()}
              </p>

            </div>

          </DashboardCard>

        </div>


        {/* ==========================================
            RESULTS
        ========================================== */}

        {hasResults ? (
          <>

            <SummaryCard
              summary={summary}
              onRetry={retryAnalysis}
            />


            <div className="grid gap-6 lg:grid-cols-2">

              <DiscussionCard
                points={discussionPoints}
              />

              <ActionItemsCard
                items={actionItems}
              />

            </div>


            <TaskAssignmentsCard
              tasks={taskAssignments}
            />


            <TranscriptCard
              transcript={transcript}
            />

          </>
        ) : (

          <DashboardCard title="Ready to Analyze">

            <div className="flex flex-col items-center justify-center py-16 text-center">

              <div className="mb-6 rounded-full bg-zinc-800 p-6">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6.75 6.75 0 006.75-6.75V6.75a6.75 6.75 0 10-13.5 0V12A6.75 6.75 0 0012 18.75zm0 0v3m-3-3h6"
                  />
                </svg>

              </div>


              <h2 className="mb-3 text-2xl font-semibold">
                Ready to analyze your first meeting
              </h2>


              <p className="max-w-xl text-zinc-400">
                Launch the SummaRise AI bot or use
                manual recording to generate a summary,
                discussion points, action items, task
                assignments, and complete transcript.
              </p>

            </div>

          </DashboardCard>

        )}

      </main>
    </>
  );
}