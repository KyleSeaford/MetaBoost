from datetime import timedelta
from django.utils import timezone
from .models import Profile

def reset_credits():
    now = timezone.now()
    profiles = Profile.objects.all()
    
    for profile in profiles:
        # Check if a month has passed since the last reset
        if now - profile.last_reset > timedelta(days=30):
            if profile.plan_type == 'free':
                profile.credits = 3
            elif profile.plan_type == 'paid':
                profile.credits = 15
            elif profile.plan_type == 'business':
                profile.credits = float('inf')  # Unlimited credits

            profile.last_reset = now
            profile.save()
