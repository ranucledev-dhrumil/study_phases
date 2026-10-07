from app.extensions import db
from datetime import datetime, timezone

class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="applied")
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # notes = db.relationship("Note", backref="application", cascade="all, delete-orphan")

    def to_dict(self):
        return { "id": self.id, "company": self.company, "status": self.status, "user_id": self.user_id, "created_at": self.created_at }