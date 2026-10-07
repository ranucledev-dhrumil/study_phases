import weaviate
from weaviate.classes.config import Configure
from weaviate.classes.query import MetadataQuery
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

client = weaviate.connect_to_local()

if client.collections.exists("Sentences"):
    client.collections.delete("Sentences")

collection = client.collections.create(
    name="Sentences",
    vectorizer_config=weaviate.classes.config.Configure.Vectorizer.none(),
)

sentences_collection = client.collections.get("Sentences")

# sentences_collection.data.insert(
#     properties={"content": "The cat sat on the mat"},
#     vector=[0.1, 0.2, 0.3, ...]  # your 384-dim embedding
# )

with sentences_collection.batch.dynamic() as batch:
    for sentence, embedding in zip(sentences, embeddings):
        batch.add_object(
            properties={"content": sentence},
            vector=embedding.tolist()  # numpy array → plain list
        )

def search_weaviate(query: str, k: int, mode: str):
    query_embedding = model.encode(query)
    if mode == "vector":
        response = sentences_collection.query.near_vector(  
            near_vector=query_embedding.tolist(),
            limit=k,
            return_metadata=weaviate.classes.query.MetadataQuery(distance=True)
        )
        return [
            (obj.properties["content"], obj.metadata.distance)
            for obj in response.objects
        ]
    
    elif mode == "hybrid":
        response = sentences_collection.query.hybrid(
            query=query,   
            vector=query_embedding.tolist(),
            alpha=0.5,
            limit=k,
            return_metadata=weaviate.classes.query.MetadataQuery(score=True)
        )
        return [
            (obj.properties["content"], obj.metadata.score)
            for obj in response.objects
        ]
    
    else:
        raise ValueError("mode must be 'vector' or 'hybrid'")

print(search_weaviate("pets and animals", 3, "vector"))
print(search_weaviate("technology and coding", 3, "vector"))
print(search_weaviate("financial news", 3, "vector"))
print("\n")
print(search_weaviate("pets and animals", 3, "hybrid"))
print(search_weaviate("technology and coding", 3, "hybrid"))
print(search_weaviate("financial news", 3, "hybrid"))

print("\nHYBRID:")
print(search_weaviate("JavaScript", 3, "hybrid"))

print("\nVECTOR:")
print(search_weaviate("JavaScript", 3, "vector"))

# hybrid search's keyword component will top the result when the pure vector search doesnt gave enough weight to that specific keyword
client.close()