from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

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

# we are forgetting something here that is related to float32 -
# embeddings = model.encode(sentences)- this will work but its better to make explicit float32 conversion
embeddings = model.encode(sentences).astype("float32")

def normalize(v):
    # same function you wrote in Session 1, just applied per-row here
    norms = np.linalg.norm(v, axis=1, keepdims=True)
    return v / norms

normalized_embeddings = normalize(embeddings)

dimensions = embeddings.shape[1]

index = faiss.IndexFlatIP(dimensions)

index.add(normalized_embeddings)

def semantic_search(query: str, k: int):
    # query_embedding = model.encode([query])
    query_embedding = model.encode([query]).astype("float32")

    # Normalize query - for IndexIP
    query_embedding = normalize(query_embedding)
    distances, indices = index.search(query_embedding, k)

    result = []
    for a in range(k):
        result.append((sentences[indices[0][a]], distances[0][a]))

    return result


# Second index, unnormalized, L2 distance
index_l2 = faiss.IndexFlatL2(dimensions)
index_l2.add(embeddings)  # original, non-normalized embeddings

def semantic_search_l2(query: str, k: int):
    query_embedding = model.encode([query]).astype("float32")
    distances, indices = index_l2.search(query_embedding, k)
    result = []
    for a in range(k):
        result.append((sentences[indices[0][a]], distances[0][a]))
    return result


print("=== IndexFlatIP (normalized, cosine-equivalent) ===")
print(semantic_search("pets and animals", 3))
print(semantic_search("financial news", 3))
print(semantic_search("technology and coding", 3))


print("\n=== IndexFlatL2 (unnormalized, euclidean) ===")
print(semantic_search_l2("pets and animals", 3))
print(semantic_search_l2("financial news", 3))
print(semantic_search_l2("technology and coding", 3))
# when i do this the third result is "The cat sat on the mat", but it isnt releavent at all,
# but it is the 3rd closest so it is provided