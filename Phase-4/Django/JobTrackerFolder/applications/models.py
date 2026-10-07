from django.db import models
from django.conf import settings

# Create your models here.

class Application(models.Model):
    STATUS_CHOICES = [
            ('applied', 'Applied'),
            ('interviewing', 'Interviewing'),
            ('offer', 'Offer'),
            ('rejected', 'Rejected'),
            ('withdrawn', 'Withdrawn'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    company = models.CharField(max_length=200)    
    role = models.CharField(max_length=200)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    date_applied = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.role} @ {self.company}"


class Note(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='Notes')
    content = models.TextField()
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Note on {self.application} ({self.created_at:%Y-%m-%d})"