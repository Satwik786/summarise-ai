import { useEffect, useRef, useState } from "react";

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

  // Saved recordings state
  const [savedRecordings, setSavedRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState("");
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  const [recordingsDropdownOpen, setRecordingsDropdownOpen] =
  useState(false);

  const recordingsDropdownRef = useRef(null);

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

    getSavedRecordings,
    analyzeSavedRecording,
  } = useMeetingAnalysis();


  const hasResults =
    transcript ||
    summary ||
    discussionPoints.length > 0 ||
    actionItems.length > 0 ||
    taskAssignments.length > 0;


    // Existing recording timer
  
  useEffect(() => {
    let interval;

    if (status === "Recording") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [status]);


    // Poll bot result
  
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


useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      recordingsDropdownRef.current &&
      !recordingsDropdownRef.current.contains(
        event.target
      )
    ) {
      setRecordingsDropdownOpen(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  // Load saved recordings

useEffect(() => {
  const loadSavedRecordings = async () => {
    try {
      setRecordingsLoading(true);

      const recordings =
        await getSavedRecordings();

      setSavedRecordings(recordings);

    } catch (error) {
      console.error(
        "FAILED TO LOAD SAVED RECORDINGS:",
        error
      );

    } finally {
      setRecordingsLoading(false);
    }
  };

  loadSavedRecordings();
}, []);


    // Format timer
  
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


    // Launch AI bot
  
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

  const stopBot = async () => {
    try {
      setBotStatus("Stopping recording...");

      const response = await api.post(
        "/bot/stop"
      );

      console.log(
        "BOT STOP RESPONSE:",
        response.data
      );

      setBotStatus(
        "Processing meeting..."
      );

    } catch (error) {
      console.error(
        "BOT STOP FAILED:",
        error
      );

      setBotStatus("Stop failed");

      alert(
        error.response?.data?.detail ||
        "Unable to stop SummaRise bot."
      );
    }
  };


// Analyze saved recording

const handleAnalyzeSavedRecording = async () => {
  if (!selectedRecording) {
    alert("Select a saved recording.");
    return;
  }

  try {
    await analyzeSavedRecording(
      selectedRecording
    );

  } catch (error) {
    console.error(
      "SAVED RECORDING ANALYSIS FAILED:",
      error
    );

    alert(
      error.response?.data?.detail ||
      "Unable to analyze saved recording."
    );
  }
};

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

  const handleMouseMove = (event) => {
    const x =
      (event.clientX / window.innerWidth) * 100;

    const y =
      (event.clientY / window.innerHeight) * 100;

    setMousePosition({
      x,
      y,
    });
  };


  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50">

      {/* Background brand wordmark */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          flex
          select-none
          items-center
          justify-center
          overflow-hidden
        "
      >
        <div
          className="
            whitespace-nowrap
            text-[9rem]
            font-bold
            tracking-[-0.06em]
            sm:text-[12rem]
            lg:text-[16rem]
            xl:text-[18rem]
          "

        >
          <span
            className="
              bg-gradient-to-r
              from-emerald-200
              via-cyan-500
              to-blue-600
              bg-clip-text
              text-transparent
              opacity-29
            "
          >
            Summa
          </span>

          <span
            className="
              bg-gradient-to-r
              from-violet-600
              via-fuchsia-500
              to-orange-400
              bg-clip-text
              text-transparent
              opacity-35
            "
          >
            Rise
          </span>
        </div>
      </div>

      <div className="relative z-10">
        <Navbar status={status} />

        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">

        <div className="mb-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Turn meetings into actionable insights
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">
            Record, transcribe, and organize meeting outcomes in one place.
          </p>
        </div>

        {/* ==========================================
            AI MEETING BOT
        ========================================== */}

        <DashboardCard title="Start a New Meeting">
          <div className="space-y-5">

            <div>
              <p className="mb-5 text-sm leading-6 text-slate-500">
                Paste a Google Meet link and SummaRise will join the
                meeting, record the conversation, and generate meeting
                insights when it ends.
              </p>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Google Meet URL
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(event) =>
                    setMeetingUrl(event.target.value)
                  }
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  disabled={botRunning}
                  className="
                    min-w-0
                    flex-1
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    hover:border-slate-400
                    focus:border-indigo-500
                    focus:ring-2
                    focus:ring-indigo-100
                    disabled:cursor-not-allowed
                    disabled:bg-slate-50
                    disabled:text-slate-500
                  "
                />

                {!botRunning ? (
                  <Button
                    onClick={launchBot}
                    disabled={!meetingUrl.trim()}
                  >
                    Launch Bot
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={stopBot}
                  >
                    End Meeting
                  </Button>
                )}
              </div>
            </div>


            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    botStatus === "Completed"
                      ? "bg-emerald-500"
                      : botStatus === "Launch failed" ||
                        botStatus === "Stop failed"
                      ? "bg-red-500"
                      : botRunning
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />

                <span className="text-sm text-slate-500">
                  Bot Status:
                </span>

                <span
                  className={`text-sm font-medium ${
                    botStatus === "Completed"
                      ? "text-emerald-700"
                      : botStatus === "Launch failed" ||
                        botStatus === "Stop failed"
                      ? "text-red-700"
                      : botRunning
                      ? "text-amber-700"
                      : "text-slate-700"
                  }`}
                >
                  {botStatus}
                </span>
              </div>

            </div>


            {botRunning && (
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-sm leading-6 text-slate-600">
                  SummaRise is waiting for the meeting to finish.
                  Results will appear automatically after transcription
                  and analysis are complete.
                </p>
              </div>
            )}

          </div>
        </DashboardCard>

        {/* ==========================================
            SAVED RECORDINGS
        ========================================== */}

        <DashboardCard title="Saved Recordings">

          <div className="space-y-4">

            <p className="text-sm leading-6 text-slate-500">
              Re-analyze a previously recorded SummaRise
              meeting.
            </p>


            {recordingsLoading ? (

              <p className="text-sm text-slate-500">
                Loading saved recordings...
              </p>

            ) : savedRecordings.length === 0 ? (

              <p className="text-sm text-slate-500">
                No saved recordings available.
              </p>

            ) : (

              <>

                <div
                  ref={recordingsDropdownRef}
                  className="relative"
                >

                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Select Recording
                  </label>


                  {/* Dropdown button */}

                  <button
                    type="button"
                    onClick={() =>
                      setRecordingsDropdownOpen(
                        (previous) => !previous
                      )
                    }
                    disabled={loading}
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                      gap-4
                      rounded-lg
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      text-left
                      text-sm
                      text-slate-700
                      outline-none
                      transition
                      hover:border-slate-400
                      focus:border-indigo-500
                      focus:ring-2
                      focus:ring-indigo-100
                      disabled:cursor-not-allowed
                      disabled:bg-slate-50
                      disabled:opacity-60
                    "
                  >

                    <span className="min-w-0 flex-1 truncate">

                      {selectedRecording
                        ? (() => {
                            const recording =
                              savedRecordings.find(
                                (item) =>
                                  item.filename ===
                                  selectedRecording
                              );

                            if (!recording) {
                              return "Choose a recording...";
                            }

                            return `${new Date(
                              recording.created_at
                            ).toLocaleString()} — ${(
                              recording.size / 1024
                            ).toFixed(1)} KB`;
                          })()
                        : "Choose a recording..."}

                    </span>


                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                        recordingsDropdownOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>

                  </button>


                  {/* Dropdown menu */}

                  {recordingsDropdownOpen && (

                    <div
                      className="
                        absolute
                        left-0
                        right-0
                        top-full
                        z-50
                        mt-2
                        max-h-72
                        overflow-y-auto
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        p-1
                        shadow-lg
                      "
                    >

                      {savedRecordings.map(
                        (recording) => {

                          const isSelected =
                            selectedRecording ===
                            recording.filename;

                          return (

                            <button
                              type="button"
                              key={recording.filename}
                              onClick={() => {
                                setSelectedRecording(
                                  recording.filename
                                );

                                setRecordingsDropdownOpen(
                                  false
                                );
                              }}
                              className={`
                                flex
                                w-full
                                items-center
                                justify-between
                                gap-4
                                rounded-md
                                px-3
                                py-3
                                text-left
                                transition-colors
                                ${
                                  isSelected
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-slate-700 hover:bg-slate-50"
                                }
                              `}
                            >

                              <span className="truncate text-sm">
                                {new Date(
                                  recording.created_at
                                ).toLocaleString()}
                              </span>


                              <span
                                className={`shrink-0 text-xs ${
                                  isSelected
                                    ? "text-indigo-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {(
                                  recording.size / 1024
                                ).toFixed(1)}
                                {" KB"}
                              </span>

                            </button>

                          );
                        }
                      )}

                    </div>

                  )}

                </div>


                <div className="flex flex-wrap items-center gap-4">

                  <Button
                    variant="secondary"
                    onClick={
                      handleAnalyzeSavedRecording
                    }
                    disabled={
                      !selectedRecording ||
                      loading
                    }
                  >
                    {loading &&
                    loadingStage ===
                      "Analyzing saved recording..."
                      ? "Analyzing..."
                      : "Analyze Recording"}
                  </Button>


                  {loading &&
                    loadingStage ===
                      "Analyzing saved recording..." && (

                      <span className="text-sm text-amber-600">
                        Transcribing and generating
                        meeting insights...
                      </span>

                    )}

                </div>

              </>

            )}

          </div>

        </DashboardCard>


        {/* ==========================================
            MANUAL RECORDING
        ========================================== */}

        <div className="grid gap-6 lg:grid-cols-2">


          <DashboardCard title="Manual Recording">

            <div className="space-y-6">

              <div>

                <p className="mb-5 text-sm leading-6 text-slate-500">
                  Record a meeting directly from your microphone
                  or browser tab.
                </p>


                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Recording Source
                </label>


                <div className="flex flex-wrap gap-x-6 gap-y-3">

                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">

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
                      className="
                        h-4
                        w-4
                        cursor-pointer
                        accent-indigo-600
                        disabled:cursor-not-allowed
                      "
                    />

                    <span>
                      Microphone
                    </span>

                  </label>


                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">

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
                      className="
                        h-4
                        w-4
                        cursor-pointer
                        accent-indigo-600
                        disabled:cursor-not-allowed
                      "
                    />

                    <span>
                      Browser Tab
                    </span>

                  </label>

                </div>


                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Browser Tab is recommended for Google Meet,
                  Zoom, Microsoft Teams and YouTube.
                </p>

              </div>


              <div className="flex flex-wrap gap-3">

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

            </div>

          </DashboardCard>


  {/* ========================================
      RECORDING STATUS
  ======================================== */}

  <DashboardCard title="Recording Status">

    <div className="space-y-6">

      <p className="text-sm leading-6 text-slate-500">
        View the current recording state and elapsed
        meeting time.
      </p>


      <div>

        <div className="flex items-center gap-2.5">

          <span
            className={`h-2.5 w-2.5 rounded-full ${
              loading
                ? "bg-amber-500"
                : status === "Recording"
                ? "bg-red-500"
                : "bg-emerald-500"
            }`}
          />


          <span className="text-sm text-slate-500">
            Status:
          </span>


          <span
            className={`text-sm font-medium ${
              loading
                ? "text-amber-700"
                : status === "Recording"
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          >
            {loading
              ? loadingStage
              : status}
          </span>

        </div>


        <p className="mt-5 text-4xl font-semibold tracking-[0.08em] text-slate-900">
          {formatTime()}
        </p>

      </div>

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
    </div>
  </div>
  );
}