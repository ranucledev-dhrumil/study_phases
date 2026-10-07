from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm

# Create your views here.
def register(request):
    if request.method == "POST":
        # The submitted data gets put into the form.
        form = UserCreationForm(request.POST)

        if form.is_valid(): 
        # Django checks things such as:
        # username requirements
        # password requirements
        # password confirmation
        # whether the passwords match
        # If everything is valid:
            form.save()
            return redirect('login')
    else: 
        # When the user first visits: /accounts/register/ - This creates an empty registration form.
        form = UserCreationForm()

    return render(request, 'registration/register.html', {'form': form})
        # then, sends that form to the template.