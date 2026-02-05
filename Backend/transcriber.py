import subprocess
import whisper
import torch
import os

def extract_audio(video_path: str, audio_path: str = "temp_audio.wav") -> str:
    if os.path.exists(audio_path):
        os.remove(audio_path)
    
    cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-ac", "1", "-ar", "16000", "-f", "wav", audio_path]
    subprocess.run(cmd, check=True, capture_output=True)
    return audio_path

def transcribe_audio(audio_path: str, model_size: str = "tiny") -> str:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🎯 Whisper {model_size} on {device}")
    
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path, language="en")
    return result["text"]
