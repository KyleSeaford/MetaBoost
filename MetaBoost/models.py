from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class Profile(models.Model):
    USER_TYPE_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
        ('business', 'Business'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    credits = models.IntegerField(default=3)
    plan_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='free')
    last_reset = models.DateTimeField(default=datetime.now)

    def __str__(self):
        return self.user.username
