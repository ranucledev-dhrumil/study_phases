import json
import config
from embedder import embed_texts, embed_query

def get_backend(dimension: int):
    if config.BACKEND == "faiss":
        from backends.faiss_backend import FaissBackend
        return FaissBackend(dimension)
    elif config.BACKEND == "pgvector":
        from backends.pgvector_backend import PgvectorBackend
        return PgvectorBackend(dimension, config.PGVECTOR_CONN)
    elif config.BACKEND == "weaviate":
        from backends.weaviate_backend import WeaviateBackend
        return WeaviateBackend(dimension)
    elif config.BACKEND == "pinecone":
        from backends.pinecone_backend import PineconeBackend
        return PineconeBackend(dimension)
    else:
        raise ValueError(f"Unknown backend: {config.BACKEND}")

with open("data/faq.json") as f:
    faq = json.load(f)

ids = [item["id"] for item in faq]
texts = [item["answer"] for item in faq]
questions = [item["question"] for item in faq]

embeddings = embed_texts(questions)

backend = get_backend(dimension=embeddings.shape[1])
backend.add_documents(ids, texts, embeddings)

print(f"Ready — searching with backend: {config.BACKEND}")

while True:
    query = input("\nSearch (or 'exit' to quit): ").strip()
    if query.lower() == "exit":
        break

    query_embedding = embed_query(query)
    results = backend.search(query_embedding, k=3)

    for text, score in results:
        print(f"{score:.4f} — {text}")