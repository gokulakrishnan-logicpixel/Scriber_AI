def chunk_text(text, chunk_size: int = 2000, overlap: int = 200) -> list:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def chunked_summarize(text: str, summarize_function, max_chunk_size: int = 2000) -> str:
    chunks = chunk_text(text, max_chunk_size)
    partials = [summarize_function(chunk) for chunk in chunks]
    combined = ' '.join(partials)
    return summarize_function(combined)
