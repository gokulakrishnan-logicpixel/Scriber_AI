import os
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'

import torch
import re
from flask import Flask, request, jsonify
from flask_cors import CORS

from transcriber import extract_audio, transcribe_audio
from summarizer import summarize_text

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ----------------------------
# 🔥 FIXED: UPLOAD → TRANSCRIPTION + SUMMARY (ONE CALL)
# ----------------------------
@app.route("/upload", methods=["POST"])
def upload_video():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No filename"}), 400

    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
    video_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(video_path)

    try:
        audio_path = "temp_audio.wav"

        # 1️⃣ Extract + Transcribe
        print("🔄 Extracting audio...")
        extract_audio(video_path, audio_path)
        print("🎤 Transcribing...")
        transcript = transcribe_audio(audio_path)

        # 2️⃣ Generate Summary (DYNAMIC LENGTH)
        print("✨ Generating summary...")
        length = len(transcript)
        
        if length < 1500:
            max_len, min_len = 120, 30
        elif length < 5000:
            max_len, min_len = 220, 80
        else:
            max_len, min_len = 350, 120

        safe_text = transcript[:3000]  # Limit for LLM
        summary = summarize_text(
            safe_text,
            max_length=max_len,
            min_length=min_len
        )

        print("✅ COMPLETE: Transcript + Summary ready!")
        
        return jsonify({
            "success": True,
            "transcript": transcript,
            "summary": summary,          # 🔥 NOW RETURNS SUMMARY
            "transcript_length": len(transcript),
            "summary_length": len(summary)
        })

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500

    finally:
        # Cleanup
        for path in [video_path, "temp_audio.wav"]:
            if os.path.exists(path):
                os.remove(path)

# ----------------------------
# Keep /summarize endpoint (bonus feature)
# ----------------------------
@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    transcript = data.get("transcript", "")

    if not transcript:
        return jsonify({"error": "No transcript"}), 400

    length = len(transcript)

    if length < 1500:
        max_len, min_len = 120, 30
    elif length < 5000:
        max_len, min_len = 220, 80
    else:
        max_len, min_len = 350, 120

    safe_text = transcript[:3000]
    summary = summarize_text(
        safe_text,
        max_length=max_len,
        min_length=min_len
    )

    return jsonify({
        "success": True,
        "transcript": transcript,
        "summary": summary
    })

if __name__ == "__main__":
    print("🚀 Scriber AI — Video → Transcript → Summary (COMPLETE)")
    print("📡 /upload endpoint: Video → Transcript + Summary")
    print("🌐 Server running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
