# Django — Phase 4

**Project:** Job Application Tracker (`JobTrackerFolder`)  
**Django version:** 6.1.1 · **Python:** 3.12 · **DB:** SQLite

---

## 📁 Project Structure

```
JobTrackerFolder/
├── manage.py              ← CLI entry point (like npm scripts)
├── db.sqlite3             ← auto-created after first migrate
├── job_tracker/           ← project config package
│   ├── settings.py        ← all config (DB, auth redirects, installed apps)
│   ├── urls.py            ← root URL dispatcher
│   └── wsgi.py
├── applications/          ← "applications" app (CRUD for job applications)
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── forms.py
│   ├── admin.py
│   └── migrations/
├── accounts/              ← "accounts" app (login / register)
│   ├── views.py
│   └── urls.py
├── templates/             ← shared base.html + registration templates
└── venv/
```

**Session notes (not runnable — reference files):**  
`S1/S1.py` · `S2/S2.py` · `S3/S3.py` · `S4/S4.py`

---

## 🚀 How to Run

### 1 — Activate the virtual environment

```powershell
cd Django\JobTrackerFolder
venv\Scripts\activate
```

> You should see `(venv)` prefix in your terminal. If not, run `python -m venv venv` first.

### 2 — Apply migrations

```powershell
python manage.py migrate
```

This creates `db.sqlite3` and applies all existing migration files. You do **not** need to run `makemigrations` unless you change a model.

### 3 — Create a superuser (for the admin panel)

```powershell
python manage.py createsuperuser
```

Enter username, email (optional), and password when prompted.

### 4 — Run the dev server

```powershell
python manage.py runserver
```

- App: [http://127.0.0.1:8000/applications/](http://127.0.0.1:8000/applications/)
- Admin: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 📚 Session Notes Reference

| File | What it explains |
|------|-----------------|
| `S1/S1.py` | MTV pattern, venv, project vs app, `INSTALLED_APPS` pitfall |
| `S2/S2.py` | Models, `makemigrations` / `migrate`, ORM CRUD, `null=True` vs `blank=True`, Admin panel |
| `S3/S3.py` | FBVs vs CBVs, `urls.py` routing, Django templates (`{% %}` / `{{ }}`), static files |
| `S4/S4.py` | ModelForms, `form.is_valid()`, CSRF, built-in `LoginView`, session auth vs JWT, flash messages |

---

## 🔧 Troubleshooting

### Quick fixes

| Symptom | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'django'` | venv not activated — run `venv\Scripts\activate` |
| `No such table: applications_application` | Run `python manage.py migrate` |
| Port 8000 already in use | `python manage.py runserver 8080` to use a different port |
| Admin login not working | Make sure you ran `createsuperuser` |
| Changes to a model not reflected | Run `python manage.py makemigrations` then `python manage.py migrate` |

### Framework-specific gotchas

**`INSTALLED_APPS` — the silent killer**  
Creating an app with `startapp` does **not** register it. Until you add it to `INSTALLED_APPS` in `settings.py`, Django ignores it — no migrations run, admin registration does nothing.

```python
# settings.py
INSTALLED_APPS = [
    ...
    'applications',   # ← must be here
    'accounts',
]
```

**CSRF errors on POST forms**  
Every HTML form must include `{% csrf_token %}` inside the `<form>` tag. Without it you get a `403 Forbidden`. This is enforced by `CsrfViewMiddleware` which is active by default.

```html
<form method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Save</button>
</form>
```

**`DoesNotExist` vs `MultipleObjectsReturned`**  
`.get()` raises `DoesNotExist` if zero rows match, and `MultipleObjectsReturned` if two or more match. Use `get_object_or_404()` to automatically turn `DoesNotExist` into a clean 404.

```python
from django.shortcuts import get_object_or_404
app = get_object_or_404(Application, pk=pk, user=request.user)
```

**Migration conflicts**  
If you see `django.db.migrations.exceptions.MigrationSchemaMissing` or migration conflicts after editing a model:

```powershell
# Delete the DB and all migration files (except __init__.py), then:
python manage.py makemigrations
python manage.py migrate
```

**`null=True` vs `blank=True`**  
- `null=True` → database column can be NULL  
- `blank=True` → form/admin accepts empty input  
- Optional fields almost always need **both**. Forgetting `blank=True` causes admin form validation to fail even when the DB column allows NULL.

**Login redirect loop**  
If logging in sends you back to the login page, check `LOGIN_REDIRECT_URL` in `settings.py`. It should point to a page that exists:

```python
LOGIN_REDIRECT_URL = '/applications/'
```

**Templates not found**  
Django looks for templates inside `<app>/templates/<app>/filename.html`. The double nesting (app name repeated) is intentional — it prevents name collisions between apps.

---

## 📖 CRUD Recipe — Django

> **Entity used:** `Book` (title, author, published_date)

### Step 1 — Define the model

```python
# myapp/models.py
from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    published_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

### Step 2 — Make and apply migrations

```powershell
python manage.py makemigrations myapp
python manage.py migrate
```

### Step 3 — Register in admin (optional but useful)

```python
# myapp/admin.py
from django.contrib import admin
from .models import Book

admin.site.register(Book)
```

### Step 4 — Create a ModelForm

```python
# myapp/forms.py
from django import forms
from .models import Book

class BookForm(forms.ModelForm):
    class Meta:
        model = Book
        fields = ['title', 'author', 'published_date']
```

### Step 5 — Write the views (FBV style)

```python
# myapp/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .models import Book
from .forms import BookForm

# READ — list
def book_list(request):
    books = Book.objects.all().order_by('-created_at')
    return render(request, 'myapp/book_list.html', {'books': books})

# READ — single
def book_detail(request, pk):
    book = get_object_or_404(Book, pk=pk)
    return render(request, 'myapp/book_detail.html', {'book': book})

# CREATE
@login_required
def book_create(request):
    form = BookForm(request.POST or None)
    if form.is_valid():
        form.save()
        return redirect('book_list')
    return render(request, 'myapp/book_form.html', {'form': form})

# UPDATE
@login_required
def book_update(request, pk):
    book = get_object_or_404(Book, pk=pk)
    form = BookForm(request.POST or None, instance=book)  # pre-fill with existing data
    if form.is_valid():
        form.save()
        return redirect('book_detail', pk=book.pk)
    return render(request, 'myapp/book_form.html', {'form': form})

# DELETE
@login_required
def book_delete(request, pk):
    book = get_object_or_404(Book, pk=pk)
    if request.method == 'POST':
        book.delete()
        return redirect('book_list')
    return render(request, 'myapp/book_confirm_delete.html', {'book': book})
```

### Step 6 — Wire up URLs

```python
# myapp/urls.py
from django.urls import path
from . import views

app_name = 'myapp'

urlpatterns = [
    path('',              views.book_list,   name='book_list'),
    path('<int:pk>/',     views.book_detail, name='book_detail'),
    path('new/',          views.book_create, name='book_create'),
    path('<int:pk>/edit/', views.book_update, name='book_update'),
    path('<int:pk>/delete/', views.book_delete, name='book_delete'),
]
```

```python
# project/urls.py  (root)
from django.urls import path, include

urlpatterns = [
    path('books/', include('myapp.urls')),
    ...
]
```

### ORM Quick Reference

```python
# Create
Book.objects.create(title="Clean Code", author="Martin")

# Read all
Book.objects.all()

# Filter
Book.objects.filter(author="Martin").order_by('-created_at')

# Get one (raises DoesNotExist if missing)
Book.objects.get(pk=1)

# Update
book = Book.objects.get(pk=1)
book.title = "New Title"
book.save()

# Bulk update
Book.objects.filter(author="Martin").update(author="R. Martin")

# Delete
Book.objects.get(pk=1).delete()
```
