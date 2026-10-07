import weaviate

client = weaviate.connect_to_local()

# Collections (not tables, but similar idea)
collection = client.collections.create(
    name="Sentences",
    vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),  # we bring our own vectors
)

sentences_collection = client.collections.get("Sentences")

# Objects (not rows, but similar idea)
# properties = the metadata/text fields (like columns). vector = the embedding, stored separately and specially indexed.
sentences_collection.data.insert(
    properties={"content": "The cat sat on the mat"},
    vector=[0.1, 0.2, 0.3, ...]  # your 384-dim embedding
)

# Batch inserts
sentences = { 

}
embeddings = []
with sentences_collection.batch.dynamic() as batch:
    for sentence, embedding in zip(sentences, embeddings):
        batch.add_object(
            properties={"content": sentence},
            vector=embedding.tolist()  # numpy array → plain list
        )


# Searching — near_vector
query_embedding = []
response = sentences_collection.query.near_vector(
    near_vector=query_embedding.tolist(),
    limit=3,
    return_metadata=weaviate.classes.query.MetadataQuery(distance=True)
)

for obj in response.objects:
    print(obj.properties["content"], obj.metadata.distance)

# By default, Weaviate uses cosine distance (configurable, similar to pgvector's operator choice) — same concept as everything else you've built, just a different API surface.

# This is Weaviate's headline feature that neither FAISS nor plain pgvector give you out of the box: combining vector (semantic) search with traditional keyword (BM25) search in a single query, blended by a weighting factor (alpha).
# Hybrid Search:
response = sentences_collection.query.hybrid(
    query="pets and animals",
    vector=query_embedding.tolist(),
    alpha=0.5,  # 0 = pure keyword search, 1 = pure vector search, 0.5 = balanced blend
    limit=3
)

# Filtering (Weaviate's equivalent of pgvector's WHERE)
from weaviate.classes.query import Filter

response = sentences_collection.query.near_vector(
    near_vector=query_embedding.tolist(),
    filters=Filter.by_property("category").equal("animals"),
    limit=3
)

# Summary comparison so far:

# Concept	            pgvector	                    Weaviate
# Storage unit	        Table row	                    Object in a Collection
# Vector search	        ORDER BY embedding <=> query	.query.near_vector()
# Filtering	            SQL WHERE	                    Filter.by_property()
# Keyword+vector combo	Manual                      	Built-in .query.hybrid()
# Infra	                Reuses existing Postgres	    Dedicated database service