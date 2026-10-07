import requests
from backends.base import VectorBackend


class PineconeBackend(VectorBackend):
    def __init__(self, dimension: int, index_name: str = "documents", base_url: str = "http://localhost:5081"):
        self.headers = {"Content-Type": "application/json", "Api-Key": "pclocal"}
        self.index_name = index_name

        resp = requests.get(f"{base_url}/indexes/{index_name}", headers=self.headers)
        if resp.status_code == 404:
            requests.post(f"{base_url}/indexes", headers=self.headers, json={
                "name": index_name,
                "dimension": dimension,
                "metric": "cosine",
                "spec": {"serverless": {"cloud": "aws", "region": "us-east-1"}}
            })

        info = requests.get(f"{base_url}/indexes/{index_name}", headers=self.headers).json()
        self.index_host = "http://" + info["host"]

    
    def add_documents(self, ids, texts, embeddings):
        vectors = [
            {"id": ids[i], "values": embeddings[i].tolist(), "metadata": {"content": texts[i]}}
            for i in range(len(texts))
        ]
        resp = requests.post(
            f"{self.index_host}/vectors/upsert",
            headers=self.headers,
            json={"vectors": vectors, "namespace": "default"}
        )
        
    def search(self, query_embedding, k):
        resp = requests.post(
            f"{self.index_host}/query",
            headers=self.headers,
            json={
                "vector": query_embedding.tolist(),
                "topK": k,
                "namespace": "default",
                "includeMetadata": True
            }
        )
        data = resp.json()

        return [(match["metadata"]["content"], match["score"]) for match in data["matches"]]