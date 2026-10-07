from django.urls import path

from .views import ApplicationListView, ApplicationDetailView, application_create, application_edit

urlpatterns = [
    path('', ApplicationListView.as_view(), name='list'), # path(URL, view, name) - When this URL pattern is matched, call ApplicationListView.
    
    path('create/', application_create, name='create'),

    path('<int:pk>/edit/', application_edit, name='edit'),

    path('<int:pk>/', ApplicationDetailView.as_view(), name='detail'),
    # What does <int:pk> mean? - /applications/5/ - matches - pk = 5
    # This tells Django: "This part of the URL should be an integer, and call it pk." 
]
# We're going to include these app URLs at: /applications/ 
# So inside the app, we don't need to repeat applications/.

# The project will eventually say: path('applications/', include(...))
# and the app says: path('', ...)

# Django combines them:
# applications/ + '' = applications/

# So: http://127.0.0.1:8000/applications/ - will reach: ApplicationListView

# as_view() - Our view is a class: class ApplicationListView(LoginRequiredMixin, ListView): 
# But Django's URL system needs something it can call when a request arrives.
# That's what: ApplicationListView.as_view() does

# Why name='list'?
# This: name='list' - gives the URL a name.

# That's extremely useful because later, instead of hardcoding: <a href="/applications/">
# we can write: <a href="{% url 'list' %}">

# The template asks Django: "Give me the URL associated with the URL named list."
# This is called URL reversing. We'll use this heavily when we create the detail links.

# Project-level urls.py
# path('applications/', include('applications.urls')) - "Anything starting with /applications/, let the applications app handle it."
# Then Django goes into: applications/urls.py - which says: path('', ApplicationListView.as_view(), name='list')

# So Django combines them:'Project URL + App URL = Final URL'

# Why split URLs into two files? - Why not just put everything in job_tracker/urls.py? - You technically can.  
# But imagine your project eventually has:
# applications/
# users/
# reports/
# notifications/

# If every URL is put in the project's urls.py, it becomes huge:
# urlpatterns = [
    # applications
    # ...

    # users
    # ...

    # reports
    # ...

    # notifications
    # ...
# ]

# Instead:
# job_tracker/urls.py
#        │
#        ├── applications/ → applications/urls.py
#        │
#        ├── users/ → users/urls.py
#        │
#        └── reports/ → reports/urls.py
# Each app manages its own routes. That's one reason Django apps are nicely modular.