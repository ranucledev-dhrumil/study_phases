from django.contrib import admin
from .models import Application, Note

# Register your models here.

class NoteInLine():
    model = Note
    extra = 1
    
@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('company', 'role', 'status', 'date_applied', 'user')
    list_filter = ('status',)
    search_fields = ('company', 'role')
    in_lines = [NoteInLine]

admin.site.register(Note)