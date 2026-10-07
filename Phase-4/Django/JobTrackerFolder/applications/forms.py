from django import forms

from .models import Application, Note


class ApplicationForm(forms.ModelForm):

    class Meta:
        model = Application
        fields = [
            'company',
            'role',
            'status',
            'date_applied',
        ]

class NoteForm(forms.ModelForm):
    class Meta:
        model = Note
        fields = ['content', 'follow_up_date']