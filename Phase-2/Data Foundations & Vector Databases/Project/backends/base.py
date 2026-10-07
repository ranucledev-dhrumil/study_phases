from abc import ABC, abstractmethod
import numpy as np


class VectorBackend(ABC):
    """
    Common interface all vector store backends must implement.
    main.py only ever talks to this interface — never to a specific backend directly.
    """

    @abstractmethod
    def add_documents(self, ids: list[str], texts: list[str], embeddings: np.ndarray) -> None:
        """
        Store documents + their embeddings.
        ids: unique identifier per document (e.g. faq-0, faq-1, ...)
        texts: the human-readable content to return on search (e.g. the answer)
        embeddings: (n, dim) array matching ids/texts by position
        """
        raise NotImplementedError

    @abstractmethod
    def search(self, query_embedding: np.ndarray, k: int) -> list[tuple[str, float]]:
        """
        Search for the k most similar documents to query_embedding.
        Returns a list of (text, score) tuples, ordered most-similar first.
        """
        raise NotImplementedError