# NumPy by hand — never used directly in production. Its value is purely pedagogical: understanding exactly what "similarity search" computes under the hood, so every tool afterward is legible rather than magic.

# FAISS — when vector search is the entire job, you're working in a Python-native ML/research pipeline, and you need maximum raw speed/control over millions of vectors in-memory, with no relational data or metadata filtering required.

# pgvector — when you already run Postgres and want vector search as one part of a larger app that also has relational data — lets you combine vector similarity with SQL WHERE/joins in a single query, no new infrastructure.

# Weaviate — when you want a dedicated vector database but are fine self-hosting it (Docker/Kubernetes), and specifically want built-in hybrid search (semantic + keyword/BM25) without building that blend yourself.

# Pinecone — when you want vector search in production without operating any infrastructure yourself — a fully managed cloud service, at the cost of a cloud dependency and its usage-based pricing.