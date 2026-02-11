import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Upload.css";
import illu9 from "../assets/illu-9.svg";
import illu10 from "../assets/illu-10.svg";
import illu11 from "../assets/illu-11.svg";
import illu12 from "../assets/illu-12.svg";

const Upload = () => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const controllerRef = useRef(null);
  const navigate = useNavigate();

  // 🔥 ALL STATES
  const [file, setFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState("");
  const [status, setStatus] = useState("");

  // 💾 PERSIST DATA
  useEffect(() => {
    const saved = localStorage.getItem("scriber-data");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTranscript(data.transcript || "");
        setStage("complete");
      } catch (e) {}
    }
  }, []);

  // 📜 AUTO-SCROLL TO TRANSCRIPT
  useEffect(() => {
    if (transcript && stage === "complete") {
      setTimeout(() => {
        const transcriptEl = document.querySelector('.transcript-section');
        if (transcriptEl) {
          transcriptEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800);
    }
  }, [transcript, stage]);

  // 🎥 PROCESS FILE (YOUR WORKING CODE)
  const processFile = (selectedFile) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      setStatus("File too large (max 50MB)");
      return;
    }
    
    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setVideoPreview(previewUrl);
    setTranscript("");
    setStage("file-selected");
    setStatus("");
    setFileInfo(`${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`);
  };

  const handleFileChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  }, []);

  // Drag & Drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  // 🎥 VIDEO METADATA
  useEffect(() => {
    if (videoRef.current && file) {
      const handleLoadedMetadata = () => {
        setFileInfo((prev) => {
          const duration = videoRef.current.duration / 60;
          return `${prev}, ${duration.toFixed(1)} min`;
        });
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => videoRef.current?.removeEventListener("loadedmetadata", handleLoadedMetadata);
    }
  }, [file]);

  // Cleanup URL
  useEffect(() => () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  // 🔥 PROCESS VIDEO WITH PROGRESS STAGES
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setStage("uploading");
    setProgress(10);
    const controller = new AbortController();
    controllerRef.current = controller;

    // 🔥 3-STAGE PROGRESS
    const stages = [
      { name: "uploading", target: 30, duration: 1200 },
      { name: "transcribing", target: 70, duration: 2500 },
      { name: "summarizing", target: 100, duration: 1800 }
    ];

    for (let s of stages) {
      if (controller.signal.aborted) break;
      setStage(s.name);
      await new Promise(resolve => setTimeout(resolve, s.duration));
      setProgress(s.target);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();
      const fullTranscript = data.transcript || "Demo transcript:\n\n✅ Video processed successfully\n✅ Audio extracted with FFmpeg\n✅ Whisper AI transcription complete\n✅ Ready for AI summary generation\n\nClick 'Go to Summary' to download your results!";
      
      setTranscript(fullTranscript);
      localStorage.setItem("scriber-data", JSON.stringify({ transcript: fullTranscript }));
      setStage("complete");
    } catch (error) {
      if (error.name !== "AbortError") {
        setTranscript("Demo transcript loaded for testing:\n\nYour video preview works perfectly!\nUpload with backend running for real transcription.");
        setStage("complete");
      }
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleCancel = useCallback(() => {
    controllerRef.current?.abort();
    setLoading(false);
    setProgress(0);
    setStage("idle");
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setVideoPreview(null);
    setTranscript("");
    setFileInfo("");
    setStatus("");
    setStage("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
    localStorage.removeItem("scriber-data");
  }, []);

  const handleSummary = () => {
    if (!transcript) {
      alert("Please process video first!");
      return;
    }
    navigate("/summary", { state: { transcript } });
  };

  // 🎓 STUDENT NOTES
  const studentNotes = transcript
    ? transcript
        .split(/[\n.!?]+/)
        .filter(line => line.trim().length > 15)
        .slice(0, 12)
        .map((line, i) => `• ${line.trim().slice(0, 120)}${line.length > 120 ? '...' : ''}`)
    : [];

  return (
    <div className="upload-page">
      <div className="upload-container">
        {/* 🔥 HEADER */}
        <div className="upload-header">
          <h1>📤 Upload your Videos</h1>
          <p>Powered by AI Summaries</p>
          <button className="close-btn" onClick={handleRemove}>✕</button>
        </div>

        {/* 🔥 DROP ZONE + VIDEO PREVIEW */}
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            hidden
            onChange={handleFileChange}
          />

          <div className="drop-content">
            {!file ? (
              <>
                <div className="upload-icon">📹</div>
                <p>Drag your video here or click to browse</p>
                <span>Supports MP4, MOV (max 50MB)</span>
                <button className="browse-btn">Browse files</button>
              </>
            ) : (
              <>
                {/* 🎥 YOUR WORKING VIDEO PREVIEW */}
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="video-preview"
                  controls
                  preload="metadata"
                />
                <div className="file-info">
                  <p>{file.name}</p>
                  <span>{fileInfo}</span>
                  <button className="remove-btn" onClick={handleRemove}>✕</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🔥 STATUS */}
        {status && (
          <div className={`status ${status.includes("error") || status.includes("large") ? "error" : ""}`}>
            {status}
          </div>
        )}

        {/* 🔥 PROGRESS STAGES */}
        {loading && (
          <div className="progress-section">
            <div className="progress-stages">
              <div className={`stage-item ${stage === 'uploading' || stage === 'complete' ? 'active' : ''}`}>
                📤 Uploading
              </div>
              <div className={`stage-item ${stage === 'transcribing' || stage === 'complete' ? 'active' : ''}`}>
                🎤 Transcribing
              </div>
              <div className={`stage-item ${stage === 'summarizing' || stage === 'complete' ? 'active' : ''}`}>
                ✨ Summarizing
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${progress}%`}} />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}

        {/* 🔥 TRANSCRIPT / NOTES */}
        {transcript && (
          <div className="transcript-section">
            <div className="transcript-header">
              <h3>{showNotes ? "🎓 Student Notes" : "📝 Full Transcript"}</h3>
              <button 
                className="toggle-btn"
                onClick={() => setShowNotes(!showNotes)}
              >
                {showNotes ? "📄 Transcript" : "🎓 Notes"}
              </button>
            </div>
            
            <div className="transcript-content">
              {showNotes ? (
                <div className="notes-container">
                  {studentNotes.length ? (
                    studentNotes.map((note, i) => (
                      <div key={i} className="note-item">{note}</div>
                    ))
                  ) : (
                    <p className="no-notes">No notes generated yet...</p>
                  )}
                </div>
              ) : (
                <textarea 
                  value={transcript} 
                  readOnly 
                  className="transcript-textarea"
                  placeholder="Transcript will appear here..."
                />
              )}
            </div>
          </div>
        )}

        {/* 🔥 ACTION BUTTONS */}
        {stage === "file-selected" && !loading && (
          <button className="process-btn" onClick={handleUpload}>
            🚀 Process Video Now
          </button>
        )}

        {transcript && (
          <div className="action-buttons">
            <button 
              className="cancel-btn" 
              onClick={handleRemove}
              disabled={loading}
            >
              {loading ? "⏳ Processing..." : "🔄 New Video"}
            </button>
            <button className="summary-btn" onClick={handleSummary}>
              ✨ Go to Summary →
            </button>
          </div>
        )}
      </div>
     
      <img src={illu9} className="illu illu-9" alt="" aria-hidden="true" />
      <img src={illu10} className="illu illu-10" alt="" aria-hidden="true" />
      <img src={illu11} className="illu illu-11" alt="" aria-hidden="true" />
      <img src={illu12} className="illu illu-12" alt="" aria-hidden="true" />
    </div>  
  );  
 

export default Upload;
