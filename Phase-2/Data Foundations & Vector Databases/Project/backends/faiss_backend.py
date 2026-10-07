import faiss
import numpy as np
from backends.base import VectorBackend


class FaissBackend(VectorBackend):
    def __init__(self, dimension: int):
        # set up self.index and whatever you need to track ids/texts
        self.dimension = dimension
        self.ids = []
        self.texts = []
        self.index = faiss.IndexFlatIP(dimension)

    def normalize(self, v):
            # same function you wrote in Session 1, just applied per-row here
            norms = np.linalg.norm(v, axis=1, keepdims=True)
            return v / norms
    
    def add_documents(self, ids: list[str], texts: list[str], embeddings: np.ndarray) -> None:
        embeddings = self.normalize(embeddings)
        self.ids.extend(ids)
        self.texts.extend(texts)
        self.index.add(embeddings)


    def search(self, query_embedding: np.ndarray, k: int) -> list[tuple[str, float]]:
        query_embedding  = query_embedding.reshape(1,-1)
        query_embedding = self.normalize(query_embedding)
        distances, indices = self.index.search(query_embedding, k)
        result = []
        for a in range(k):
            result.append((self.texts[indices[0][a]], distances[0][a]))
    
        return result