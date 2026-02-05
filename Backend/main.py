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

@app.route("/gpu-status")
def gpu_status():
    return jsonify({"cuda": torch.cuda.is_available(), "device": "cuda" if torch.cuda.is_available() else "cpu"})

@app.route("/upload", methods=["POST"])
def upload_video():
    print("📱 Upload received")
    
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No filename"}), 400

    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
    video_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(video_path)
    
    size_mb = os.path.getsize(video_path) / 1024 / 1024
    print(f"💾 Saved: {safe_name} ({size_mb:.1f}MB)")

    try:
        # BULLETPROOF PIPELINE
        print("🚀 ULTRA-FAST Processing...")
        audio_path = "temp_audio.wav"
        
        # 1. Extract audio
        extract_audio(video_path, audio_path)
        
        # 2. Transcribe (TINY = 25sec)
        transcript = transcribe_audio(audio_path)
        print(f"📝 Transcript: {len(transcript)} chars")
        
        # 3. CRASH-PROOF Summary (truncate + single pass)
        short_transcript = transcript[:3000]  # Fix index error
        summary = summarize_text(short_transcript)
        
        # Cleanup
        for path in [video_path, audio_path]:
            if os.path.exists(path):
                os.remove(path)
                
        return jsonify({
            "success": True,
            "summary": summary,
            "transcript_length": len(transcript),
            "summary_length": len(summary)
        })
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Scriber AI (45sec NO-CRASH)")
    print(f"PyTorch: {torch.__version__}")
    app.run(host="127.0.0.1", port=5000, debug=False, threaded=True)
