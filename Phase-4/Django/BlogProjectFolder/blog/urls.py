from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView

from .views import PostsListView, PostDetailView, PostUpdateView, PostDeleteView, post_create, comment_create, signup

urlpatterns = [
    path('', PostsListView.as_view(), name='post_list'),
    path('<int:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('create/', post_create, name='post_create'),
    path('<int:pk>/edit/', PostUpdateView.as_view(), name='post_edit'),
    path('<int:pk>/delete/', PostDeleteView.as_view(), name='post_delete'),
    path('<int:pk>/comment/', comment_create, name='comment_create'),

    path('signup/', signup, name='signup'),
    path('login/', LoginView.as_view(template_name='blog/login.html'), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
]