# ┌─────────────────────────────────────┐
# │  Artificial Intelligence (AI)       │
# │  ┌─────────────────────────────┐    │
# │  │  Machine Learning (ML)      │    │
# │  │  ┌─────────────────────┐    │    │
# │  │  │  Deep Learning (DL) │    │    │
# │  │  └─────────────────────┘    │    │
# │  └─────────────────────────────┘    │
# └─────────────────────────────────────┘

import numpy as np

# Pretend these are embeddings for 5 documents (already vectorized, 4 dimensions each)
documents = {
    "doc1: The cat sat on the mat": np.array([0.9, 0.1, 0.0, 0.2]),
    "doc2: Dogs are loyal animals":  np.array([0.8, 0.3, 0.1, 0.1]),
    "doc3: The stock market crashed today": np.array([0.1, 0.9, 0.4, 0.0]),
    "doc4: Investors are worried about inflation": np.array([0.2, 0.8, 0.5, 0.1]),
    "doc5: Python is a popular programming language": np.array([0.0, 0.1, 0.9, 0.8]),
}

query = "query: Tell me about pets"
query_vec = np.array([0.85, 0.2, 0.05, 0.15])

def cosine_similarity(v1, v2):
    dot_prod = np.dot(v1, v2)
    mag_v1 = np.linalg.norm(v1)
    mag_v2 = np.linalg.norm(v2)

    return dot_prod/(mag_v1*mag_v2)

def euclidean_distance(v1, v2):
    return np.linalg.norm(v1-v2)


results = []

for document, vector in documents.items():
    cosine = cosine_similarity(vector, query_vec)
    distance = euclidean_distance(vector, query_vec)

    results.append((document, cosine, distance))


cosine_ranking = sorted(results, key=lambda x: x[1], reverse=True)
print("COSINE RANKING")

for rank, (document, cosine, distance) in enumerate(cosine_ranking, 1):
    print(f"{rank}. {document} → {cosine:.4f}")


euclidean_ranking = sorted(results, key=lambda x: x[2])
print("\nEUCLIDEAN RANKING")

for rank, (document, cosine, distance) in enumerate(euclidean_ranking, 1):
    print(f"{rank}. {document} → {distance:.4f}")

# Top result: cosine says 1. doc1: The cat sat on the mat → 0.9903
# euclidean says1. doc2: Dogs are loyal animals → 0.1323 - different?
# Full ranking: diffrent order in both? they differ from the 1st
# Why: cosine only cares about direction (angle from origin), euclidean cares about both direction AND magnitude (raw distance in space). Two vectors can point in a very similar direction but have different "lengths" — cosine would rank them close, euclidean might not, if a third vector is closer in raw distance but pointing a bit  more "off-angle".
def normalize(v):
    return v / np.linalg.norm(v)

query_vec_norm = normalize(query_vec)

normalized_results = []
for document, vector in documents.items():
    vec_norm = normalize(vector)
    cosine = cosine_similarity(vec_norm, query_vec_norm)
    distance = euclidean_distance(vec_norm, query_vec_norm)
    normalized_results.append((document, cosine, distance))

cosine_ranking_norm = sorted(normalized_results, key=lambda x: x[1], reverse=True)
print("NORMALIZED COSINE RANKING")
for rank, (document, cosine, distance) in enumerate(cosine_ranking_norm, 1):
    print(f"{rank}. {document} → {cosine:.4f}")

euclidean_ranking_norm = sorted(normalized_results, key=lambda x: x[2])
print("\nNORMALIZED EUCLIDEAN RANKING")
for rank, (document, cosine, distance) in enumerate(euclidean_ranking_norm, 1):
    print(f"{rank}. {document} → {distance:.4f}")