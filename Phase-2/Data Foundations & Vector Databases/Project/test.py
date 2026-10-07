import json
from embedder import embed_texts, embed_query
from backends.pinecone_backend import PineconeBackend

with open("data/faq.json") as f:
    faq = json.load(f)

ids = [item["id"] for item in faq]
texts = [item["answer"] for item in faq]
questions = [item["question"] for item in faq]  # what we'll embed and search over

embeddings = embed_texts(questions)  # embed the questions, not answers — search matches user intent to question phrasing

backend = PineconeBackend(embeddings.shape[1])
backend.add_documents(ids, texts, embeddings)

query_embedding = embed_query("I can't log into my account")
results = backend.search(query_embedding, k=3)

for text, score in results:
    print(f"{score:.4f} — {text}")