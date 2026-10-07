import psycopg2  
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
# print(embeddings.shape)

conn = psycopg2.connect(
    host="localhost",
    port=5433,
    user="postgres",
    password="learning123",
    dbname="postgres"  
)

cur = conn.cursor()

# CREATE:
# cur.execute("CREATE TABLE sentences (id serial PRIMARY KEY, content text, embedding vector(384))");

# INSERT:
# for sentence, embedding in zip(sentences, embeddings):
#     embedding_str = "[" + ",".join(map(str, embedding)) + "]"

#     cur.execute(
#         """
#         INSERT INTO sentences (content, embedding)
#         VALUES (%s, %s)
#         """,
#         (sentence, embedding_str)
#     )


# conn.commit()
cur.close()



def semantic_search_pg(query: str, k: int):
    cur = conn.cursor()
    embedding = model.encode(query)

    embedding_str = "[" + ",".join(map(str, embedding)) + "]"
    
    cur.execute(
        """
        SELECT content, embedding <=> %s 
        FROM sentences
        ORDER BY embedding <=> %s
        LIMIT %s;
        """,
        (embedding_str, embedding_str, k)
    )

    result = cur.fetchall()
    cur.close()
    return result


results = semantic_search_pg("pets and animals", 3)
for sentence, distance in results:
    print(f"{sentence}:  {distance:.2f}")

results2 = semantic_search_pg("technology and coding", 3)
print("\n")
for sentence, distance in results2:
    print(f"{sentence}:  {distance:.2f}")

results3 = semantic_search_pg("financial news", 3)
print("\n")
for sentence, distance in results3:
    print(f"{sentence}:  {distance:.2f}")

# I got the same result as FAISS

conn.close()

# In actual projects pgvector is more releavent as we can get the product or any other data along with the search query directly
# i would reach for FAISS, when the task is data heavy and the searching requires more control on vectors not only on the content 