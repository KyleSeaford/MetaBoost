from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    USER_TYPE_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
        ('business', 'Business'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    credits = models.IntegerField(default=3)
    plan_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='free')
    last_reset = models.DateTimeField(default=timezone.now)

    def reset_credits(self):
        """ Resets credits based on plan type. """
        if self.plan_type == 'free':
            self.credits = 3
        elif self.plan_type == 'paid':
            self.credits = 15
        elif self.plan_type == 'business':
            self.credits = float('inf')  # Infinite credits for business users

        self.last_reset = timezone.now()  # Update the last reset time
        self.save()

    def __str__(self):
        return self.user.username
