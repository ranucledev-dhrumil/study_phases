from django.shortcuts import render, redirect, get_object_or_404

# Create your views here.
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import ListView, DetailView
from django.contrib.auth.decorators import login_required
from .models import Application
from django.contrib import messages

from .forms import ApplicationForm, NoteForm

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
class ApplicationListView(LoginRequiredMixin, ListView):
    model = Application
    template_name = 'applications/application_list.html'
    context_object_name = 'applications'
    ordering = ['-date_applied']

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)


class ApplicationDetailView(LoginRequiredMixin, DetailView):
    model = Application
    template_name = 'applications/application_detail.html'
    context_object_name = 'application'

    def get_queryset(self):
        return Application.objects.filter(user=self.request.user) # Filter the queryset by the current user in both list and detail views.

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # "Django, give me the normal context that DetailView would have created."
        context['notes'] = self.object.Notes.all()
        # self.object - Because we're using DetailView, Django retrieves one Application.
        # That object becomes: self.object
        # For example: self.object -> Application #5 -> Google - Backend Developer

        # Remember your model:
        # application = models.ForeignKey(
        #     Application,
        #     on_delete=models.CASCADE,
        #     related_name='notes'
        # )
        # The important part here is: related_name='notes'
        # That gives us: application.notes.all()
        # So: self.object.notes.all(), means: "Give me all Notes related to this Application."

        # Django sends information from the view to the template through the context.

        context['note_form'] = NoteForm()


        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()

        form = NoteForm(request.POST)

        if form.is_valid():
            note = form.save(commit=False)

            note.application = self.object

            note.save()
            messages.success(
                request,
                'Note added successfully.'
            )

            return redirect(
                'detail',
                pk=self.object.pk
            )

        context = self.get_context_data()
        context['note_form'] = form

        return self.render_to_response(context) 
# ListView
#     ↓
# Application 1
# Application 2
# Application 3
# Application 4


# DetailView
#     ↓
# Application 2

# How does Django know which application?
# /applications/5/ - The 5 is the application's primary key.

# Django's DetailView understands that pattern and can use it to find: Application.objects.get(pk=5)

# Conceptually:
# GET /applications/5/
        #   │
        #   ▼
    #    DetailView
        #   │
        #   ▼
# Application with id=5
# We'll configure that URL in a moment.

@login_required
def application_create(request):
    if request.method == 'POST':
        form = ApplicationForm(request.POST)

        if form.is_valid():

            application = form.save(commit=False) # Build object
            # Create the Application Python object, but don't save it to the database yet.

            application.user = request.user # Add information the form doesn't know
            # Why does the form not know request.user?

            # This is another important Django concept.
            # The form receives: request.POST - which contains browser-submitted data.
            # For example: 
            # company=Google
            # role=Backend Developer
            # status=applied
            # date_applied=2026-09-23
            # But request.user comes from Django's authentication system. The form doesn't automatically know about the HTTP request.
            # The view has access to both: request.POST + request.user
    
            application.save() # Save object

            messages.success(
                request,
                'Application created successfully.'
            )

            return redirect(
                'detail',
                pk=application.pk
            )
    else:
        form = ApplicationForm()

    return render(
        request,
        'applications/application_form.html',
        {'form': form}
    )

@login_required
def application_edit(request, pk):

    application = get_object_or_404(
        Application,
        pk=pk,
        user=request.user
    )

    if request.method == 'POST':

        form = ApplicationForm(
            request.POST,
            instance=application
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                'Application updated successfully.'
            )

            return redirect(
                'detail',
                pk=application.pk
            )

    else:
        form = ApplicationForm(
            instance=application
        )
        # Django gives us:
        # Company:       [Google             ]
        # Role:          [Backend Developer  ]
        # Status:        [Applied             ]
        # Date applied:  [2026-09-23         ]

    return render(
        request,
        'applications/application_form.html',
        {
            'form': form,
            'application': application,
        }
    )

# This is doing two checks simultaneously.

# Imagine the URL is: /applications/5/edit/ - Django gets: pk = 5

# Then effectively asks the database: 
# Find Application
# WHERE id = 5
# AND user = current logged-in user

# If it belongs to the user: 
# Application #5
#       ↓
# belongs to current user
#       ↓
# YES
#       ↓
# return application
#       ↓
# show edit form

# If it belongs to someone else:
# Application #5
#       ↓
# belongs to current user?
#       ↓
# NO
#       ↓
# No matching object
#       ↓
# 404

# application = get_object_or_404(
#     Application,
#     pk=pk
# ) That would only check: Does Application #5 exist?