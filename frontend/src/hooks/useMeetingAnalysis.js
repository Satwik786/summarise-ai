import { useState } from "react";
import api from "../services/api";

export default function useMeetingAnalysis() {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");

  const [summary, setSummary] = useState("");
  const [transcript, setTranscript] = useState("");
  const [discussionPoints, setDiscussionPoints] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState([]);


  // ---------------------------------------------
  // Apply analysis data to dashboard
  // ---------------------------------------------

  const applyAnalysisResult = (data) => {
    setTranscript(data.transcript || "");
    setSummary(data.summary || "");
    setDiscussionPoints(data.discussion_points || []);
    setActionItems(data.action_items || []);
    setTaskAssignments(data.task_assignments || []);
  };


  // ---------------------------------------------
  // Existing manual recording flow
  // ---------------------------------------------

  const analyzeMeeting = async (audioBlob) => {
    setLoading(true);

    try {
      setLoadingStage("Uploading audio...");

      const formData = new FormData();

      formData.append(
        "file",
        audioBlob,
        "meeting.webm"
      );

      const uploadResponse = await api.post(
        "/meeting/upload",
        formData
      );

      setLoadingStage("Transcribing audio...");

      const transcriptText =
        uploadResponse.data.transcript;

      setTranscript(transcriptText);

      setLoadingStage(
        "Generating AI summary..."
      );

      const analysisResponse = await api.post(
        "/meeting/analyze",
        {
          transcript: transcriptText,
        }
      );

      applyAnalysisResult({
        ...analysisResponse.data,
        transcript: transcriptText,
      });

      setLoadingStage("Completed");

    } finally {
      setLoading(false);
    }
  };


  // ---------------------------------------------
  // Apply completed bot result
  // ---------------------------------------------

  const applyBotResult = (data) => {
    applyAnalysisResult(data);
    setLoadingStage("Completed");
  };


  // ---------------------------------------------
  // Check whether bot result is ready
  // ---------------------------------------------

  const getBotResult = async () => {
    const response = await api.get(
      "/bot/result"
    );

    const data = response.data;

    if (!data.ready) {
      return null;
    }

    applyBotResult(data);

    return data;
  };


  // ---------------------------------------------
  // Retry Gemini analysis
  // ---------------------------------------------

  const retryAnalysis = async () => {
    if (!transcript) return;

    setLoading(true);

    try {
      setLoadingStage(
        "Generating AI summary..."
      );

      const response = await api.post(
        "/meeting/analyze",
        {
          transcript,
        }
      );

      const data = response.data;

      if (!data.success) {
        setSummary(data.summary);
        return;
      }

      applyAnalysisResult({
        ...data,
        transcript,
      });

    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };


  return {
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
    applyBotResult,
  };
}