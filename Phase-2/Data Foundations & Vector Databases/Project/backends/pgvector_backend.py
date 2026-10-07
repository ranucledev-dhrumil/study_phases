import psycopg2 
from backends.base import VectorBackend


class PgvectorBackend(VectorBackend):
    def __init__(self, dimension: int, conn_params: dict):
        self.dimension = dimension
        self.conn = psycopg2.connect(
            host= conn_params["host"],
            port=conn_params["port"],
            user=conn_params["user"],
            password=conn_params["password"],
            dbname=conn_params["dbname"]  
        )
        self.cur = self.conn.cursor()
        self.cur.execute("""CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, content text, embedding vector(%s))""", (dimension, ));
        self.conn.commit()

    def add_documents(self, ids, texts, embeddings):
        for id, sentence, embedding in zip(ids, texts, embeddings):
            embedding_str = "[" + ",".join(map(str, embedding)) + "]"

        self.cur.execute(
            """
            INSERT INTO documents (id, content, embedding)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE
            SET content = EXCLUDED.content,
                embedding = EXCLUDED.embedding
            """,
            (id, sentence, embedding_str)
        )
        self.conn.commit()

    def search(self, query_embedding, k):        
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
            
        self.cur.execute(
            """
            SELECT content, embedding <=> %s 
            FROM documents
            ORDER BY embedding <=> %s
            LIMIT %s;
            """,
            (embedding_str, embedding_str, k)
        )
        results = self.cur.fetchall()
        return [(content, 1 - distance) for content, distance in results]