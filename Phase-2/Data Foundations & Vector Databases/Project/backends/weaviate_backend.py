import weaviate
from backends.base import VectorBackend


class WeaviateBackend(VectorBackend):
    def __init__(self, dimension: int, collection_name: str = "Documents"):
        self.client = weaviate.connect_to_local()

        if self.client.collections.exists(collection_name):
            self.client.collections.delete(collection_name)

        self.collection = self.client.collections.create(
            name=collection_name,
            vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),
        )

    
    def add_documents(self, ids, texts, embeddings):
        with self.collection.batch.dynamic() as batch:
            for id, text, embedding in zip(ids, texts, embeddings):
                batch.add_object(
                    properties={"content": text, "external_id": id},
                    vector=embedding.tolist()
                )
        
    def search(self, query_embedding, k):
        results = self.collection.query.near_vector(
            near_vector=query_embedding.tolist(),
            limit=k,
            return_metadata=weaviate.classes.query.MetadataQuery(distance=True)
        )

        return [(obj.properties["content"], (1 - obj.metadata.distance)) for obj in results.objects]