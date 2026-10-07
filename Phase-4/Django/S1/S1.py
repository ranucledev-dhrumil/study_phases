# 1. Django Architecture — MTV Pattern

# Django calls its pattern MTV (Model-Template-View), which maps to the more familiar MVC — but the naming is shifted in a way that trips people up coming from Spring or Express:
# | Django Role  | Description                      | Spring Boot Equivalent            | Express Equivalent     |
# | ------------ | -------------------------------- | --------------------------------- | ---------------------- |
# | **Model**    | Data layer, ORM                  | JPA `@Entity`                     | Mongoose Schema        |
# | **View**     | Request handling, business logic | `@Controller` / `@RestController` | Route handler function |
# | **Template** | Presentation / HTML rendering    | Thymeleaf / JSP                   | EJS / Handlebars       |

# The confusing part: what Django calls a "View" is what you'd call a Controller. What Django calls a "Template" is what MVC calls the View. There is no separate "Controller" concept — Django's URL dispatcher routes a request straight to a view function/class, which is closer to how Express routes straight to a handler, minus Express's total lack of opinion about what that handler does next.

# Django is batteries-included, much more like Spring Boot than like Express. Where Express gave you nothing (you chose Mongoose, chose your own folder structure, wired up middleware by hand), Django ships with: an ORM, an admin panel, a forms system, an auth system, a templating engine, and a CLI (django-admin/manage.py) that scaffolds things for you — similar in spirit to Spring Initializr + Spring Data + Spring Security bundled together, but configured with plain Python instead of annotations/XML.

# 2. Environment Setup (quick walkthrough)
# Create and activate a virtual environment (like a fresh node_modules, but for the whole Python env)
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install Django
pip install django

# Confirm
python -m django --version

# A venv exists because Python packages install globally by default (no automatic per-project node_modules-style isolation). Every Python project you touch should get its own venv — it's the equivalent of npm install being local by default in Node.

# 3. Project vs App Structure
# Project = the whole Django site/config — settings, root URL config, WSGI/ASGI entry point. You create exactly one per deployable site.
# App = a self-contained module of functionality (e.g. applications, accounts, blog). A project is composed of one or more apps. Apps are meant to be reusable/pluggable.

# There's no single Express/Spring equivalent — the closest analogy: imagine if Spring Boot forced you to split every feature into its own Maven module with its own models/views/urls, all registered into one root app. Nobody in Node does this by convention, but it's the deliberate Django idiom, and it's a habit you'll want to build now because it matters for how apps get registered, migrated, and admin-registered independently.

# Create the project (the outer container)
django-admin startproject job_tracker .

# Inside it, create your first app
python manage.py startapp applications

# Resulting shape:

# job_tracker/          <- project config package
#     settings.py        <- like application.properties / .env + config combined
#     urls.py             <- root URL dispatcher
#     wsgi.py / asgi.py
# applications/          <- your first app
#     models.py           <- ORM models live here
#     views.py             <- "controllers"
#     admin.py              <- register models for the admin panel
#     urls.py               <- app-level routes (you create this; not auto-generated)
#     apps.py
#     migrations/
# manage.py               <- CLI entry point, like `npm run` scripts collapsed into one file

# A critical step people forget: creating an app with startapp does not register it. You must add it to INSTALLED_APPS in settings.py:
INSTALLED_APPS = [
    ...
    'applications',
]
# Until you do that, Django doesn't know the app exists — no migrations, no admin registration, nothing.