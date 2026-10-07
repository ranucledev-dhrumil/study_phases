CREATE TABLE workspace_document_tags (
    doc_id TEXT NOT NULL,
    tag    TEXT NOT NULL,
    PRIMARY KEY (doc_id, tag),
    FOREIGN KEY (doc_id) REFERENCES workspace_documents(id) ON DELETE CASCADE
);
CREATE INDEX idx_workspace_document_tags_tag ON workspace_document_tags(tag);
