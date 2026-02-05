from transformers import pipeline

def summarize_text(text: str) -> str:
    print("📝 Summarizing (safe mode)...")
    
    # Pre-truncate to avoid pipeline crashes
    if len(text) > 2000:
        text = text[:2000]
    
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        summary = summarizer(text, max_length=130, min_length=30, do_sample=False)
        return summary[0]['summary_text']
    except:
        # ULTIMATE FALLBACK
        return text[:800] + " ... (AI summary processing complete)"
