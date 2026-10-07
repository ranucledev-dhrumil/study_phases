# 1. Function-Based vs Class-Based Views
# A Django view is a Python callable that takes a request and returns a response — same job as an Express route handler or a Spring @GetMapping method.

# Function-based view (FBV):
# applications/views.py
from django.shortcuts import render, get_object_or_404
# from .models import Application

def application_list(request):
    applications = Application.objects.filter(user=request.user).order_by('-date_applied')
    return render(request, 'applications/application_list.html', {'applications': applications})

def application_detail(request, pk):
    application = get_object_or_404(Application, pk=pk, user=request.user)
    return render(request, 'applications/application_detail.html', {'application': application})

# This should feel almost identical to an Express handler — explicit, imperative, you control every line.

# Class-based view (CBV) — Django's generic views handle common patterns (list, detail, create, update, delete) with far less code:
from django.views.generic import ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin

class ApplicationListView(LoginRequiredMixin, ListView):
    model = Application
    template_name = 'applications/application_list.html' # When you're ready to display the list, use this template
    context_object_name = 'applications'
    # By default, Django's ListView gives the template a variable called something like:  object_list -  We could use that, but it's not very descriptive.
    # Instead: context_object_name = 'applications'- means the template will receive: applications. 
    # So later we'll be able to write: {% for application in applications %} - Much easier to understand.

# Django's ListView needs to know: "Which Application objects should I display?"- That's called the queryset. 
# Normally you might have: Application.objects.all()
# which means: Give me every application. But that's not what we want. 
# We want: Give me applications belonging to the currently logged-in user.
# So: Application.objects.filter(user=self.request.user)
# self.request.user - 
# When someone makes a request: GET /applications/ - Django has a request object: self.request - Django's authentication system attaches the current user to it: self.request.user
# So if John is logged in: self.request.user - represents John.
# Then: Application.objects.filter(user=self.request.user) - effectively means: Find Applications WHERE user = John

# If Sarah is logged in:
# Find Applications
# WHERE user = Sarah
# That's how each user gets their own data.

# "If ordering = ['-date_applied'] is already there, why don't we put the ordering inside get_queryset()?"
# But Django's ListView lets us express the ordering separately: ordering = ['-date_applied'], while get_queryset() handles the user-specific filtering.

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user).order_by('-date_applied') # newest -> oldest
        # and without '-' : newest -> oldest

class ApplicationDetailView(LoginRequiredMixin, DetailView):
    model = Application
    template_name = 'applications/application_detail.html'

# ListView - "I want a Django view whose basic job is to display a list."
#    ├── get data
#    ├── send data to template
#    └── render response
# CBVs are the closest thing Django has to Spring's annotation-driven magic — ListView/DetailView/CreateView/UpdateView/DeleteView give you working CRUD with minimal code, at the cost of "magic" you have to learn (method resolution order, which hooks to override — get_queryset, get_context_data, form_valid, etc.). 
# LoginRequiredMixin is a mixin class that redirects anonymous users to the login page — composition via multiple inheritance, a very different flavor from Express middleware chains or Spring Security filter chains, but the same underlying job (gatekeeping before the view logic runs).

# Trade-off you'll feel immediately: FBVs are more explicit and match how you think coming from Express; CBVs are less code once you have several similar views, but you're now learning Django's own inheritance hierarchy rather than plain Python control flow.
# Most real Django codebases mix both — CBVs for standard CRUD, FBVs for anything custom.

# 2. URL Routing
# Django's routing is centralized and explicit — no decorators on the handler itself (unlike Spring's @GetMapping("/applications") sitting directly on the method). 
# Instead, URLs are wired in a separate urls.py, closer in spirit to Express's router.get('/applications', handler) but split project-level → app-level.
# job_tracker/urls.py (project-level root)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('applications/', include('applications.urls')),
]

# applications/urls.py (app-level)
from django.urls import path
from . import views

app_name = 'applications'

urlpatterns = [
    path('', views.ApplicationListView.as_view(), name='list'),
    path('<int:pk>/', views.ApplicationDetailView.as_view(), name='detail'),
]

# Notes:

# <int:pk> is a path converter — Django validates and casts the URL segment to an int before your view ever sees it. Compare to Express's req.params.id, which arrives as a raw string you'd manually parse and validate yourself.
# CBVs are registered with .as_view() — this is what turns the class into an actual callable Django can route to.
# app_name + name='list' enables reverse URL lookup — you never hardcode /applications/3/ anywhere; instead you write reverse('applications:detail', args=[3]) in Python or {% url 'applications:detail' application.pk %} in a template. If you ever change the URL structure, every reference updates automatically. 
# Express has nothing built-in equivalent to this — you'd hardcode path strings or roll your own helper.

# 3. Template Rendering & Static Files
# Django's template language (DTL) is deliberately not a full programming language inside your HTML — this is a hard design choice, unlike EJS where you can drop raw JS into <% %> tags.
# <!-- applications/templates/applications/application_list.html -->
# {% extends "base.html" %}

# {% block content %}
#   <h1>My Applications</h1>
#   <ul>
#     {% for app in applications %}
#       <li>
#         <a href="{% url 'applications:detail' app.pk %}">{{ app.company }} — {{ app.role }}</a>
#         <span class="status">{{ app.get_status_display }}</span>
#       </li>
#     {% empty %}
#       <li>No applications yet.</li>
#     {% endfor %}
#   </ul>
# {% endblock %}

# <!-- templates/base.html -->
# {% load static %}
# <!DOCTYPE html>
# <html>
# <head>
#   <link rel="stylesheet" href="{% static 'css/style.css' %}">
# </head>
# <body>
#   {% block content %}{% endblock %}
# </body>
# </html>

# Key ideas:

# {{ }} outputs a value; {% %} is a template tag (control flow, template logic). No arbitrary Python execution is allowed inside templates — this is intentional, to keep logic out of presentation (a stricter separation than EJS, where you'd write raw if/for in JS).
# {% extends %} + {% block %} is template inheritance — a base.html defines shared layout, child templates override named blocks. This maps loosely to a shared EJS layout via includes, but it's a first-class, built-in feature here rather than a convention you'd hand-roll.
# app.get_status_display — for any field with choices, Django auto-generates a get_<field>_display() method returning the human-readable label ("Interviewing") instead of the raw stored value ("interviewing"). No equivalent in Mongoose unless you write it yourself.
# Static files (CSS/JS/images) are served via {% static %} and require STATICFILES_DIRS/STATIC_URL config in settings.py — conceptually similar to Express's express.static() middleware, but Django distinguishes static files (fixed assets) from media files (user uploads) with entirely separate settings (MEDIA_URL/MEDIA_ROOT), which you'll need later if you ever let users attach a resume/cover letter to an application.

# Django's default template lookup: each app can have its own templates/<app_name>/ directory, and Django searches across all installed apps' template dirs. The nested applications/templates/applications/ folder structure (app name repeated) is a deliberate convention to avoid template name collisions between apps.

