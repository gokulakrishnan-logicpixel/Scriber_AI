from transformers import pipeline

# We load the model ONCE (important for speed)
summarizer_pipeline = pipeline(
    "summarization",
    model="facebook/bart-large-cnn"
)

def summarize_text(
    text: str,
    max_length: int = 130,
    min_length: int = 30
) -> str:
    print(f"📝 Summarizing (max={max_length}, min={min_length})")

    # Hard safety truncate (pipeline crash protection)
    if len(text) > 2000:
        text = text[:2000]

    try:
        result = summarizer_pipeline(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False
        )
        return result[0]["summary_text"]

    except Exception as e:
        print("⚠️ Summarizer fallback:", e)
        return text[:800] + " ... (summary generated safely)"
