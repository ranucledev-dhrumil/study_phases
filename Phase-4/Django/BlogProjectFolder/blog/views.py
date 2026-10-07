from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView, UpdateView, DeleteView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.urls import reverse_lazy


from .models import Post
from .forms import PostForm, SignUpForm, CommentForm

# Create your views here.
class PostsListView(ListView):
    model = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    ordering = ['-created_at']
    paginate_by = 5

class PostDetailView(DetailView):
    model = Post
    template_name = 'blog/post_detail.html'
    context_object_name = 'post'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['comment_form'] = CommentForm()
        return context


class PostUpdateView(LoginRequiredMixin, UpdateView):
    model = Post
    template_name = 'blog/post_form.html'
    form_class = PostForm

    def get_queryset(self):
        return super().get_queryset().filter(author = self.request.user)

    def form_valid(self, form):
        messages.success(self.request,  'Post updated successfully')
        return super().form_valid(form)

class PostDeleteView(LoginRequiredMixin, DeleteView):
    model = Post
    template_name = 'blog/confirm_delete.html'
    success_url = reverse_lazy('post_list')

    def get_queryset(self):
        return super().get_queryset().filter(author = self.request.user)

    def form_valid(self, form):
        messages.success(self.request,  'Post Deleted successfully')
        return super().form_valid(form)

@login_required
def post_create(request):
    if request.method == "POST":
        form = PostForm(request.POST)

        if form.is_valid():
            post = form.save(commit=False)

            post.author = request.user
            post.save()
            messages.success(
                request, 
                'Post Created Successfully'
            )
            return redirect(
                'post_detail',
                pk=post.pk
            )
    else:
        form = PostForm()

    return render(
        request,
        'blog/post_form.html',
        {'form': form}
    )

@login_required
def comment_create(request, pk):
    post = get_object_or_404(Post, pk=pk)

    if request.method == 'POST':
        form = CommentForm(request.POST)

        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            comment.save()

            messages.success(
                request,
                'Comment added successfully.'
            )

    return redirect('post_detail', pk=post.pk)

def signup(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(
                request, 
                'Register Done, Login to continue'
            )
            return redirect(
                'login'
            )
    else:
        form = SignUpForm()

    return render(
        request,
        'blog/register.html',
        {'form': form}
    )

