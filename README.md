# Medifist-
Scriber AI - Video Summarizer 🚀

# How to run ?
### Steps :

Clone the repository

```bash
Project repo: https://github.com/
```

### STEP 01- Create a conda environment after opening the repository

```bash
conda create -n scriber-ai python=3.9 -y
```

```bash
conda activate scriber-ai
```

### STEP 02- install the requirements
```bash
pip install -r requirements.txt
```

### STEP 03- install the npm for react
```bash
npm install
```

### STEP 04- Download FFmpeg (Required for video processing)
```bash
Download from: https://ffmpeg.org/download.html
```

### STEP 05- Run Backend API
```bash
python main.py
```

### STEP 06- Run Frontend 
```bash
cd frontend
npm run dev
```

# requirements.txt🔧

flask==2.3.3
flask-cors==4.0.0
openai-whisper==20231117
transformers==4.36.2
torch==2.5.1
ffmpeg-python==0.2.0



### Techstack Used:

BACKEND:
• Python 3.9+
• Flask (API Server)
• OpenAI Whisper (TINY) - Audio Transcription
• Transformers (BART-large-cnn) - Text Summarization
• FFmpeg - Video to Audio Extraction
• PyTorch 2.5.1 - AI Acceleration (CPU)

FRONTEND:
• React 18
• Vite (Build Tool)
• TailwindCSS / Custom CSS
• Axios (API Calls)

CORE FEATURES:
• Anaconda Environment
• CORS Enabled
• Production Error Handling
• Glassmorphism UI Design
• Drag & Drop File Upload
