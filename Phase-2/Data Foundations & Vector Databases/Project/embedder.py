from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

def embed_texts(texts: list[str]) -> np.ndarray:
    # encode a list of strings, return embeddings array
    embeddings = model.encode(texts)

    return embeddings.astype("float32")

def embed_query(query: str) -> np.ndarray:
    # encode a single query string, return one embedding
    query_embeddings = model.encode(query)

    return query_embeddings.astype("float32")