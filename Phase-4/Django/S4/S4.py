# 1. Django Forms

# A Django Form (or ModelForm) handles rendering HTML form fields, validating submitted data, and converting it into Python types — roughly the job that express-validator/Joi + manual HTML did in your MERN stack, but tightly integrated with the model layer.

# ModelForm is the one you'll use almost always for CRUD — it auto-generates fields from a model:
# applications/forms.py
from django import forms
from .models import Application, Note

class ApplicationForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = ['company', 'role', 'status', 'date_applied']
        widgets = {
            'date_applied': forms.DateInput(attrs={'type': 'date'}),
        }

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['content', 'follow_up_date']
        widgets = {
            'follow_up_date': forms.DateInput(attrs={'type': 'date'}),
        }

# Using it in a view:

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import ApplicationForm

@login_required
def application_create(request):
    if request.method == 'POST':
        form = ApplicationForm(request.POST)
        if form.is_valid():
            application = form.save(commit=False)   # don't hit DB yet
            application.user = request.user          # set the field the form doesn't expose
            application.save()
            return redirect('applications:detail', pk=application.pk)
    else:
        form = ApplicationForm()
    return render(request, 'applications/application_form.html', {'form': form})

# form.is_valid() runs all field-level validation (required, max_length, type coercion) plus any custom clean_<field>()/clean() methods you define — similar job to a Joi schema .validate(), but bound to the model's own field definitions so you don't redeclare types twice.
# commit=False gives you the model instance before saving, so you can set fields not exposed in the form (like user) — a pattern you'd recognize from manually attaching
# req.user._id before Model.create() in Mongoose, except here it's a deliberate two-step API rather than just object mutation.
# login_required is the FBV equivalent of LoginRequiredMixin for CBVs — same job, different mechanism (decorator vs mixin).

# login_required is the FBV equivalent of LoginRequiredMixin for CBVs — same job, different mechanism (decorator vs mixin).
# <!-- applications/templates/applications/application_form.html -->
# {% extends "base.html" %}
# {% block content %}
# <form method="post">
#   {% csrf_token %}
#   {{ form.as_p }}
#   <button type="submit">Save</button>
# </form>
# {% endblock %}

# {{ form.as_p }} renders every field wrapped in <p> tags with auto-generated labels/errors — convenient for prototyping, though most real projects hand-roll the fields ({{ form.company }}, {{ form.company.errors }}, etc.) for actual styling control.

# 2. CSRF
# {% csrf_token %} is mandatory on every POST form. Django's CsrfViewMiddleware rejects any unsafe request (POST/PUT/DELETE) that doesn't carry a valid CSRF token — this is on by default and much stricter than what you dealt with in Express, where CSRF protection (if present at all) was usually a csurf middleware you had to opt into and wire up yourself. For an API-style JSON view (e.g. if this were DRF instead of template forms), CSRF works differently — session-authenticated requests still need it, token-authenticated ones typically don't — but for classic server-rendered forms like this, it's always required.

# 3. Authentication (login/logout/register)
# Django ships django.contrib.auth with working login/logout views out of the box — you don't hand-roll bcrypt/JWT like you did in MERN.
# job_tracker/urls.py
from django.contrib.auth import views as auth_views

urlpatterns = [
    ...
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
]

# Django's built-in LoginView handles credential checking, session creation, and redirect-after-login — all the manual work you did with bcrypt.compare() + issuing a JWT is replaced by Django's session-based auth, which stores a signed session ID in a cookie rather than a token in localStorage/Authorization header. This is a meaningful architectural difference, worth sitting with:
# +-----------------------------+--------------------------------------------+----------------------------------------------+
# |                             |  Django default                            | Your MERN JWT setup                          |
# +-----------------------------+--------------------------------------------+----------------------------------------------+
# | What's stored client-side   | Session cookie (signed, httpOnly)          | JWT (localStorage or cookie)                 |
# | Where session state lives   | Server-side (DB-backed session table)      | Nowhere — JWT is self-contained/stateless    |
# | Logout                      | Server deletes the session row             | Client discards token (or blocklist)         |
# | CSRF exposure               | Needs CSRF protection (cookies auto-sent)  | Not needed if token is in Authorization      |
# |                             |                                            | header                                       |
# +-----------------------------+--------------------------------------------+----------------------------------------------+

# Registration has no built-in view (Django assumes you'll customize it), so you write it with UserCreationForm:
# accounts/views.py (or applications/views.py if you skip a separate app)
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()   # hashes the password automatically — never touches plaintext
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

# form.save() here hashes the password using Django's configured password hasher (PBKDF2 by default) — equivalent to your bcrypt.hash() call, just invoked implicitly by the form rather than something you call yourself.

# 4. Sessions & Messages
# Sessions: request.session is a dict-like object backed by the DB (or cache/file, configurable) — this is what session-based login relies on. You can also use it yourself for arbitrary temporary state (request.session['last_search'] = query), similar to how you might have used req.session if you'd used express-session, except Django wires this up by default with zero extra config.
# Messages: the django.contrib.messages framework lets a view queue a one-time notification that survives the redirect and displays once on the next page — Django's built-in equivalent of manually flashing a toast via query param or session, common in Express apps without a dedicated library.
from django.contrib import messages

def application_create(request):
    ...
    if form.is_valid():
        ...
        messages.success(request, "Application added successfully.")
        return redirect('applications:list')

# <!-- in base.html, rendered once wherever you want flash messages to show -->
# {% for message in messages %}
#   <div class="alert alert-{{ message.tags }}">{{ message }}</div>
# {% endfor %}
# Requires django.contrib.messages.middleware.MessageMiddleware and the context processor — both are in settings.py by default in a fresh project.
