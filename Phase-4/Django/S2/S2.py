# 1. Models
# A Django model is a Python class that maps to a database table — same concept as a Mongoose Schema or a JPA @Entity, but the syntax and philosophy differ:

# applications/models.py
from django.db import models
from django.conf import settings

class Application(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('interviewing', 'Interviewing'),
        ('offer', 'Offer'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    company = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    date_applied = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.role} @ {self.company}"

# | Concept               | Django                                                                                                                                    | Mongoose                                                                                                                                                 |
# | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
# | **Schema definition** | Class attributes are field instances such as `CharField`, `DateField`, `IntegerField`, etc.                                               | A schema object is created using `mongoose.Schema()`.                                                                                                    |
# | **Field typing**      | Uses explicit, database-backed field types that map closely to SQL column types.                                                          | Uses JavaScript-oriented types with optional validators.                                                                                                 |
# | **Relationships**     | Provides `ForeignKey`, `ManyToManyField`, and `OneToOneField` for relational relationships. The database can enforce these relationships. | Uses `ref` to reference another document and `populate()` to retrieve related documents. Relationships are generally not enforced like SQL foreign keys. |
# | **Primary key**       | Automatically creates an `id` field, typically an auto-incrementing integer, unless you define your own primary key.                      | Automatically creates an `_id` field, which is an `ObjectId` by default.                                                                                 |
# | **Choices / Enums**   | Can define `choices=[...]`; Django can use these for validation and display in forms/admin.                                               | Commonly uses `enum: [...]` as a schema validator.                                                                                                       |
# | **Database**          | Primarily designed around relational SQL databases such as PostgreSQL, MySQL, and SQLite.                                                 | Primarily designed for MongoDB, a document-oriented NoSQL database.                                                                                      |
# | **Migrations**        | Django has a built-in migration system using `makemigrations` and `migrate`.                                                              | Mongoos                                                                                                                                                  |

# on_delete=models.CASCADE has no real Mongoose equivalent — since Mongo has no enforced foreign keys, you'd have handled cascading deletes manually or via middleware. Django enforces referential integrity at the DB level (SQLite/Postgres/MySQL all support it), and every ForeignKey must declare an on_delete behavior: CASCADE (delete children too), PROTECT (block deletion), SET_NULL, etc.

# Now the related Note model — one application can have many follow-up notes:
class (models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note on {self.application} ({self.created_at:%Y-%m-%d})"

# null=True vs blank=True is a distinction with no Mongoose equivalent and trips everyone up initially:

# null=True → database-level: column can store NULL.
# blank=True → validation-level: form/admin can accept an empty value.

# You almost always want both together for an optional field. Setting only null=True on a CharField/TextField is considered bad practice in Django (you get two "empty" states — NULL and '') — this is Django-specific pedantry that doesn't exist in Mongoose, where undefined and missing keys are just... missing.

# 2. Migrations
# Migrations are Django's schema version control
# think of them as the ORM-generated equivalent of hand-written SQL migration files (Spring Boot users with Flyway/Liquibase will recognize the pattern immediately; Mongoose has nothing like this because MongoDB is schemaless).

python manage.py makemigrations applications   # generates a migration file describing the schema change
python manage.py migrate                        # applies it to the actual database
# makemigrations diffs your models against the last known migration state and writes a new numbered file (0001_initial.py, 0002_...py, etc.) — it does not touch the database. migrate is what actually runs the SQL. This two-step split (generate vs apply) is deliberate: it lets you review the generated migration before running it, and lets migrations be committed to version control and replayed identically on every environment (dev, CI, prod) — closer in spirit to Flyway than to anything in the Mongo world.

# 3. ORM CRUD

# Create
app = Application.objects.create(user=request.user, company="Acme", role="Backend Engineer", date_applied="2026-09-01")

# Read
Application.objects.all()                              # all rows
Application.objects.filter(status='applied')            # WHERE status = 'applied'
Application.objects.get(id=1)                            # single row, raises if 0 or 2+ matches
Application.objects.filter(user=request.user).order_by('-date_applied')

# Update
app.status = 'interviewing'
app.save()
# or in bulk:
Application.objects.filter(status='applied').update(status='withdrawn')

# Delete
app.delete()

# | Concept                       | Django ORM                                                                                                                                                                           | Mongoose                                                                                                                                                    |
# | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
# | **Query execution**           | `Model.objects.filter(...)` returns a lazy **QuerySet**. The database query is generally executed when the QuerySet is evaluated, such as when iterated over or converted to a list. | `Model.find(...)` returns a **Query** object. It can be awaited directly, which executes the query and returns the results.                                 |
# | **Getting one object**        | `.get()` expects exactly one object. It raises `DoesNotExist` if there are no results and `MultipleObjectsReturned` if there is more than one.                                       | `.findOne()` returns the matching document or `null` if nothing is found.                                                                                   |
# | **Filtering**                 | Uses ORM methods such as `.filter()`, `.exclude()`, `.order_by()`, etc.                                                                                                              | Uses methods such as `.find()`, `.findOne()`, `.sort()`, etc.                                                                                               |
# | **Related-object lookups**    | Can traverse relationships directly using **double-underscore (`__`) syntax**. Example: `Note.objects.filter(application__company="Acme")`                                           | Typically uses `.populate()` to load referenced documents, then filters in JavaScript, or uses MongoDB's aggregation pipeline for database-side operations. |
# | **Relationships in queries**  | Django ORM understands SQL relationships such as `ForeignKey` and can generate the necessary SQL joins automatically.                                                                | Mongoose references using `ref` are not SQL-style joins. `.populate()` performs additional queries to retrieve referenced documents.                        |
# | **Asynchronous code**         | The traditional Django ORM API is synchronous, so ordinary ORM calls don't require `await`. Modern Django also provides asynchronous ORM methods in appropriate contexts.            | Mongoose is commonly used with JavaScript's `async/await` syntax.                                                                                           |
# | **Example: multiple records** | `applications = Application.objects.filter(status="applied")`                                                                                                                        | `const applications = await Application.find({ status: "applied" })`                                                                                        |
# | **Example: one record**       | `application = Application.objects.get(id=1)`                                                                                                                                        | `const application = await Application.findById(1)`                                                                                                         |
# | **No result**                 | `.get()` → raises `DoesNotExist`                                                                                                                                                     | `.findOne()` / `.findById()` → returns `null`                                                                                                               |
# | **Result type**               | QuerySet containing Django model instances                                                                                                                                           | Array of Mongoose documents for `.find()`, or a single document for `.findOne()` / `.findById()`                                                            |

# That double-underscore (__) syntax is worth sitting with — it's how Django ORM does joins/lookups without writing raw SQL:
# All notes for applications at "Acme" with status "interviewing"
Note.objects.filter(application__company="Acme", application__status="interviewing")

# Count notes per application (reverse relation, using related_name)
app.notes.count()
app.notes.all()

# 4. Admin Panel
# This is one of Django's headline features — a fully working CRUD UI, generated from your models, with zero frontend code. Nothing in MERN or Spring gives you this for free (Spring Boot Admin is a different thing entirely — an ops dashboard, not a data CRUD UI).
# applications/admin.py
from django.contrib import admin
from .models import Application, Note

class NoteInline(admin.TabularInline):
    model = Note
    extra = 1

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('company', 'role', 'status', 'date_applied', 'user')
    list_filter = ('status',)
    search_fields = ('company', 'role')
    inlines = [NoteInline]

admin.site.register(Note)
# TabularInline lets you edit an Application's related Notes on the same admin page — like an embedded subdocument array in a Mongoose schema, except here it's just a UI convenience over two real relational tables.

# The double-underscore (__) syntax traverses relations — application__company reaches across the ForeignKey from Note to Application and filters on its company field. This is Django's join syntax, generating a real SQL JOIN under the hood, no raw SQL or .populate() needed.
