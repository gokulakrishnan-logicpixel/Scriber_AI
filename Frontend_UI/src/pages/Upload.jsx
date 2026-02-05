import { useRef, useState, useCallback, useEffect } from "react";
import "./Upload.css";
import illu9 from "../assets/illu-9.svg";
import illu10 from "../assets/illu-10.svg";
import illu11 from "../assets/illu-11.svg";
import illu12 from "../assets/illu-12.svg";


const Upload = () => {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const controllerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState("");
  const [status, setStatus] = useState(""); // idle, uploading, success, error

  // Supported formats
  const allowedTypes = ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv"];

  // File select
  const handleFileChange = useCallback((e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    processFile(selected);
  }, []);

  const processFile = (selectedFile) => {
    if (selectedFile.size > 50 * 1024 * 1024) {
      setStatus("File too large (max 50MB)");
      return;
    }
    if (!allowedTypes.includes(selectedFile.type)) {
      setStatus("Unsupported format. Use MP4, AVI, MOV, WMV, or FLV.");
      return;
    }

    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setVideoPreview(previewUrl);
    setSummary("");
    setProgress(0);
    setStatus("");
    setFileInfo(`${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`);
  };

  // Drag & Drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, []);

  // Load video metadata
  useEffect(() => {
    if (videoRef.current && file) {
      videoRef.current.addEventListener("loadedmetadata", () => {
        setFileInfo((prev) =>
          `${prev}, ${(videoRef.current.duration / 60).toFixed(1)} min`
        );
      });
    }
  }, [file]);

  // Cleanup URL
  useEffect(() => () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  // Upload with Fetch + Progress (note: native Fetch progress limited; Axios recommended for production)
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setStatus("Uploading...");
    setSummary("");
    setProgress(0);
    const controller = new AbortController();
    controllerRef.current = controller;

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress (replace with real chunked upload/Axios for accuracy)
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setSummary(data.summary);
      setStatus("Summary generated!");
    } catch (error) {
      if (error.name !== "AbortError") {
        setStatus(error.message);
      }
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [file]);

  const handleCancel = useCallback(() => {
    controllerRef.current?.abort();
    setLoading(false);
    setProgress(0);
    setStatus("");
  }, []);

  const handleRemove = useCallback(() => {
    setFile(null);
    setVideoPreview(null);
    setSummary("");
    setFileInfo("");
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [file]);

  return (
    <div className="upload-page" role="main">
      <div className="upload-card" role="region" aria-label="Video upload">
        {/* Header */}
        <div className="upload-header">
          <div>
            <h1 className="upload-title">Upload your Video</h1>
            <p>Generate AI-powered summary from your video content</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          aria-label="Drop video or click to browse"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="video/*"
            hidden
            onChange={handleFileChange}
            aria-hidden="true"
          />

          <div className="drop-content">
            {!file ? (
              <>
                <div className="upload-icon" aria-hidden="true">📁</div>
                <p>Drag your video here or click to browse</p>
                <span>Supports MP4, AVI, MOV (max 50MB)</span>
                <button className="browse-btn" aria-label="Browse files">
                  Browse files
                </button>
              </>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="video-preview"
                  controls
                  preload="metadata"
                  aria-label="Video preview"
                />
                <div className="file-info">
                  <p className="file-name">{file.name}</p>
                  <span>{fileInfo}</span>
                  <button
                    className="remove-btn"
                    onClick={handleRemove}
                    aria-label="Remove file"
                  >
                    ✕ Remove
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        {status && (
          <div className={`status ${status.includes("error") || status.includes("large") ? "error" : ""}`}>
            {status}
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
        )}

        {/* Footer */}
        <div className="upload-footer">
          <span className="file-limit" aria-label="File size limit">
            Max: 50 MB • MP4/AVI/MOV supported
          </span>
          <div className="actions">
            {loading ? (
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            ) : file ? (
              <button className="next-btn" onClick={handleUpload}>
                Generate Summary
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="summary-card" role="region" aria-label="Video summary">
          <div className="summary-header">
            <h2>AI Summary</h2>
            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(summary)}
              aria-label="Copy summary"
            >
              📋
            </button>
          </div>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {/* Illustrations */}
      <img src={illu9} className="illu illu-9" alt="" aria-hidden="true" />
      <img src={illu10} className="illu illu-10" alt="" aria-hidden="true" />
      <img src={illu11} className="illu illu-11" alt="" aria-hidden="true" />
      <img src={illu12} className="illu illu-12" alt="" aria-hidden="true" />
    </div>
  );
};

export default Upload;
