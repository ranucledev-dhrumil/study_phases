import time
import requests
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

sentences = [
    "The cat sat on the mat",
    "Dogs are loyal animals",
    "I adopted a puppy last week",
    "The stock market crashed today",
    "Investors are worried about inflation",
    "The central bank raised interest rates",
    "Python is a popular programming language",
    "I wrote a script to automate my tests",
    "JavaScript is used for web development",
    "The weather is sunny and warm today"
]

embeddings = model.encode(sentences)

BASE = "http://localhost:5081"
HEADERS = {"Content-Type": "application/json", "Api-Key": "pclocal"}

# 1. Create the index (control-plane call)
requests.post(f"{BASE}/indexes", headers=HEADERS, json={
    "name": "sentences",
    "dimension": 384,
    "metric": "cosine",
    "spec": {"serverless": {"cloud": "aws", "region": "us-east-1"}}
})

# 2. Get the index's actual host (Pinecone Local assigns a per-index port)
info = requests.get(f"{BASE}/indexes/sentences", headers=HEADERS).json()
index_host = "http://" + info["host"]
print(index_host)

# 3. Upsert all sentences
vectors = [
    {"id": f"sent-{i}", "values": embeddings[i].tolist(), "metadata": {"content": sentences[i]}}
    for i in range(len(sentences))
]

resp = requests.post(
    f"{index_host}/vectors/upsert",
    headers=HEADERS,
    json={"vectors": vectors, "namespace": "default"}
)
print(resp.json())

time.sleep(2)  # brief pause for indexing

# 4. Query function
def search_pinecone(query: str, k: int):
    query_embedding = model.encode(query).tolist()
    resp = requests.post(
        f"{index_host}/query",
        headers=HEADERS,
        json={
            "vector": query_embedding,
            "topK": k,
            "namespace": "default",
            "includeMetadata": True
        }
    )
    data = resp.json()
    return [(match["metadata"]["content"], match["score"]) for match in data["matches"]]

print(search_pinecone("pets and animals", 3))
print(search_pinecone("technology and coding", 3))
print(search_pinecone("financial news", 3))

# For numpy by hand i will do it for learning purposes to get to know the insights of how it works
# For FAISS, i would like to use it in large dataset or when it is dataheavy, like ml or researching data projects
# For pgvector/SQL, we can get the product or any other data along with the search query directly
# For weaviate, we can use it when the data is more like nosql that is document type and when we can work with both the hybrid search, the main highlight of it
# For pinecone, pinecone can be used when the schema is more important like the structure needs to be consistent 