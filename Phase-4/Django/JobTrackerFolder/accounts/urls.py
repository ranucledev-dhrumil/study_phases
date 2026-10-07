from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView

from .views import register

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    # Django, use your built-in login logic, but render my registration/login.html template.
    path('logout/', LogoutView.as_view(), name='logout'),
]