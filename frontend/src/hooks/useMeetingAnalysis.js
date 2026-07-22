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

  const analyzeMeeting = async (audioBlob) => {
    setLoading(true);

    try {
      setLoadingStage("Uploading audio...");

      const formData = new FormData();
      formData.append("file", audioBlob, "meeting.webm");

      const uploadResponse = await api.post("/meeting/upload", formData);

      setLoadingStage("Transcribing audio...");

      const transcriptText = uploadResponse.data.transcript;

      setTranscript(transcriptText);

      setLoadingStage("Generating AI summary...");

      const analysisResponse = await api.post("/meeting/analyze", {
        transcript: transcriptText,
      });

      const data = analysisResponse.data;

      setSummary(data.summary || "");
      setDiscussionPoints(data.discussion_points || []);
      setActionItems(data.action_items || []);
      setTaskAssignments(data.task_assignments || []);

      setLoadingStage("Completed");
    } finally {
      setLoading(false);
    }
  };

  const retryAnalysis = async () => {
    if (!transcript) return;

    setLoading(true);

    try {
      setLoadingStage("Generating AI summary...");

      const response = await api.post("/meeting/analyze", {
        transcript,
      });

      const data = response.data;

      if (!data.success) {
        setSummary(data.summary);
        return;
      }

      setSummary(data.summary || "");
      setDiscussionPoints(data.discussion_points || []);
      setActionItems(data.action_items || []);
      setTaskAssignments(data.task_assignments || []);
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
  };
}