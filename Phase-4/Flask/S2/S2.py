# 1. Jinja2 — What It's For
# Jinja2 is Flask's template engine — same role as Django's template language, but different syntax and philosophy (Jinja allows more logic in templates than Django intentionally permits).

from flask import render_template

@app.route("/applications/view")
def view_applications():
    apps = [{"company": "Acme", "status": "applied"}]
    return render_template("applications.html", applications=apps)

# render_template looks for templates/applications.html relative to your app package (this is one reason Flask(__name__) needs to know where your app lives).

# <!-- templates/applications.html -->
# <!DOCTYPE html>
# <html>
# <body>
#   <h1>Applications</h1>
#   <ul>
#     {% for app in applications %}
#       <li>{{ app.company }} — {{ app.status }}</li>
#     {% else %}
#       <li>No applications yet.</li>
#     {% endfor %}
#   </ul>
# </body>
# </html>

# Key syntax:

# {{ expr }} — outputs a value (auto-escaped for HTML safety, unlike raw Python f-strings)
# {% ... %} — control flow: for, if, block, extends
# {% extends "base.html" %} + {% block content %}...{% endblock %} — template inheritance, roughly analogous to a layout component in React or a base template in Django.

# 2. Flask-WTF / WTForms - standing for Web Templates Forms. 
# What It's For - WTForms defines a form as a Python class, with each field carrying its own validators — this replaces manually checking request.form fields and writing validation by hand.
from flask_wtf import FlaskForm
from wtforms import StringField, SelectField
from wtforms.validators import DataRequired, Length

class ApplicationForm(FlaskForm):
    company = StringField("Company", validators=[DataRequired(), Length(max=100)])
    status = SelectField("Status", choices=[("applied", "Applied"), ("interview", "Interview")])
# FlaskForm (from Flask-WTF, not raw WTForms) automatically wires in CSRF protection — a hidden token embedded in the form and validated on submit. This is the Flask/Django-style equivalent of what you'd do manually with a CSRF middleware in Express, or what a Spring Security filter would give you automatically.

# 3. Handling a POST with a Form
@app.route("/applications/new", methods=["GET", "POST"])
def new_application():
    form = ApplicationForm()
    if form.validate_on_submit():   # True only on POST + passes validators + valid CSRF
        company = form.company.data
        status = form.status.data
        # save it (later: to the DB)
        flash("Application created!")
        return redirect(url_for("view_applications"))
    return render_template("new_application.html", form=form)

# validate_on_submit() does three things at once: 
# checks it's a POST, 
# runs all field validators, and 
# checks the CSRF token 
# this single call replaces what would otherwise be several manual if request.method == "POST" / try-except blocks.

# <form method="POST">
#   {{ form.hidden_tag() }}  <!-- renders the CSRF token -->
#   {{ form.company.label }} {{ form.company() }}
#   {{ form.status.label }} {{ form.status() }}
#   <button type="submit">Save</button>
# </form>

# flash() stores a one-time message in the session, retrieved in a template with get_flashed_messages() — similar in spirit to a toast notification you'd trigger client-side in React, but server-managed via cookies/session instead of client state.

# 4. Why This Matters for a JSON API (and why it mostly won't):
# Your actual Job Tracker API won't use render_template or WTForms for its real endpoints — a JSON API takes request.json, and you'll validate with something like Marshmallow, Pydantic, or manual checks (more on this in Session 3). CSRF protection specifically is a browser-form concern; token-based JSON APIs typically skip it and rely on other protections (CORS config, JWT). You're learning Jinja/WTForms here mainly so you can recognize them, not because your API build will lean on them.
