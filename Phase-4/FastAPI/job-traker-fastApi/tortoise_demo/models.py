from tortoise import fields, models
from app.schemas.applications import ApplicationStatus

class Application(models.Model):
    id = fields.IntField(pk=True)
    company = fields.CharField(max_length=100)
    role = fields.CharField(max_length=100)
    status = fields.CharEnumField(ApplicationStatus, default=ApplicationStatus.applied)
    applied_on = fields.DateField(null=True)
    url = fields.CharField(max_length=2048, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "applications"

class Note(models.Model):
    id = fields.IntField(pk=True)
    application = fields.ForeignKeyField(
        "models.Application", related_name="notes", on_delete=fields.CASCADE
    )
    body = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)