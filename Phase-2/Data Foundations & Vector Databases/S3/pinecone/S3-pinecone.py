from pinecone.grpc import PineconeGRPC as Pinecone

# API key value is ignored by Pinecone Local, but the SDK requires *something* be passed
pc = Pinecone(api_key="pclocal", host="http://localhost:5081")

print(pc.list_indexes())

# Index (top-level container)
# An Index in Pinecone is roughly equivalent to a Weaviate Collection or a Postgres table — it's where your vectors live. But creating one requires you to specify the dimension and similarity metric upfront, at creation time (not flexible after):
from pinecone import ServerlessSpec

pc.create_index(
    name="sentences",
    dimension=384,          # must match your embedding size
    metric="cosine",        # or "euclidean", "dotproduct"
    spec=ServerlessSpec(cloud="aws", region="us-east-1")  # required by SDK even locally, but ignored by Pinecone Local
)

# Namespaces (Pinecone-specific concept)
# Within a single Index, Pinecone lets you partition data into namespaces — isolated slices of the same index, useful for multi-tenant apps (e.g., one namespace per customer) without needing separate indexes. Neither pgvector nor Weaviate has a direct equivalent to this — it's a Pinecone-specific organizational tool.
index = pc.Index(host="...")  # get a handle to your created index
index.upsert(vectors=[...], namespace="default")

embedding = []
sentences = []
# Upsert (their term for insert/update)
# Pinecone calls insertion "upsert" (update-or-insert) — if you insert with an ID that already exists, it overwrites; if not, it creates.
index.upsert(
    vectors=[
        {"id": "sent-0", "values": embedding.tolist(), "metadata": {"content": sentences[0]}},
        {"id": "sent-1", "values": embedding.tolist(), "metadata": {"content": sentences[1]}},
        # ...
    ],
    namespace="default"
)
# Notice: every vector needs an explicit id (string) — unlike pgvector's auto-incrementing serial or Weaviate's auto-generated UUIDs, you're responsible for assigning IDs yourself.

query_embedding = []
# Querying:
response = index.query(
    vector=query_embedding.tolist(),
    top_k=3,
    namespace="default",
    include_metadata=True
)

for match in response.matches:
    print(match.metadata["content"], match.score)
# match.score here is a similarity score (higher = more similar) when using metric="cosine" — opposite convention from pgvector's <=> (which is distance, lower = more similar). Worth remembering: same underlying math, different sign convention depending on the tool.

# Metadata filtering
response = index.query(
    vector=query_embedding.tolist(),
    top_k=3,
    filter={"category": {"$eq": "animals"}},
    include_metadata=True
)
# Same concept as pgvector's WHERE or Weaviate's Filter.by_property()

# SUMMARY COMPARISON: pgvector vs Weaviate vs Pinecone

# Concept          | pgvector                  | Weaviate                  | Pinecone
# -----------------|---------------------------|---------------------------|----------------------------
# Container        | Table                     | Collection                | Index
# Item             | Row                       | Object                    | Vector record
# Insert           | INSERT                    | .data.insert() / batch    | .upsert()
# ID               | auto serial               | auto UUID                 | You assign explicitly
# Search           | ORDER BY <=>              | .near_vector()            | .query()
# Score direction  | Distance (lower=closer)   | Distance (lower=closer)   | Similarity (higher=closer,
#                  |                           |                           | for cosine)
# Filtering        | SQL WHERE                 | Filter.by_property()      | filter={...} dict
# Special feature  | Reuses existing Postgres  | Built-in hybrid search    | Namespaces (multi-tenancy)
# Infra            | Extension in your DB      | Dedicated service         | Fully managed cloud