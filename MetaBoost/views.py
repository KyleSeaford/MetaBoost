from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.decorators import method_decorator
from asgiref.sync import sync_to_async  # For converting DB operations to async
from .models import Profile
from dotenv import load_dotenv
import json
import os
import requests

# Load environment variables from a .env file
load_dotenv()

from .forms import LoginForm, SignupForm

def home(request):
    return render(request, 'index.html')

def legal(request):
    return render(request, 'legal.html')

def support(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/login")
    
    return render(request, 'support.html')

@login_required
def dash(request):
    profile = request.user.profile  # Get the user's profile to access credits
    credits = profile.credits       # Get the current number of credits
    plan_type = profile.plan_type   # Get the plan type (e.g., 'free', 'paid', 'business')
    max_credits = 3 if plan_type == 'free' else 15 if plan_type == 'paid' else 'Unlimited'
    
    context = {
        'credits': credits,
        'max_credits': max_credits,
        'plan_type': plan_type  # Pass the plan type to the context
    }

    return render(request, 'dash.html', context)


def login_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/dashboard")
    
    if request.method == "POST":
        login_form = LoginForm(request.POST)
        if login_form.is_valid():
            authenticated_user = authenticate(request, username=login_form.cleaned_data.get("username"), password=login_form.cleaned_data.get("password"))
            if authenticated_user is not None:
                login(request=request, user=authenticated_user)
            return HttpResponseRedirect("/dashboard")

    return render(request, 'login.html')

def signup_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/dashboard")
    
    if request.method == "POST":
        signup_form = SignupForm(request.POST)
        if signup_form.is_valid():
            if User.objects.filter(username=signup_form.cleaned_data.get("username")).first():
                return render(request, 'signup.html')
            
            # Create a new user
            user = User.objects.create_user(
                username=signup_form.cleaned_data.get("username"), 
                password=signup_form.cleaned_data.get("password")
            )

            # Automatically create a profile with 3 credits (default for free users)
            Profile.objects.create(user=user)

            # Authenticate and log in the user
            authenticated_user = authenticate(
                request, 
                username=signup_form.cleaned_data.get("username"), 
                password=signup_form.cleaned_data.get("password")
            )
            if authenticated_user is not None:
                login(request=request, user=authenticated_user)
            return HttpResponseRedirect("/dashboard")

    return render(request, 'signup.html')


from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages

@login_required
def upgrade_to_paid(request):
    # Update user plan to 'paid'
    user = request.user
    user.profile.plan_type = 'paid'

    # Set 15 credits for the paid plan
    user.profile.credits = 15
    user.profile.save()

    # Simulate redirect to payment page
    messages.success(request, "You've chosen the Paid Plan. Please proceed to payment.")
    return redirect('payment_simulation')

@login_required
def upgrade_to_business(request):
    # Update user plan to 'business'
    user = request.user
    user.profile.plan_type = 'business'
    
    # Set unlimited credits (or use a large number, e.g., 10000 for simplicity)
    user.profile.credits = float('100000000') 
    user.profile.save()

    # Simulate redirect to payment page
    messages.success(request, "You've chosen the Business Plan. Please proceed to payment.")
    return redirect('payment_simulation')

def payment_simulation(request):
    # A simple page simulating the payment process
    return render(request, 'payment_simulation.html')

from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required
def revert_account(request):
    # Revert the user's plan to 'free'
    user = request.user
    user.profile.plan_type = 'free'
    user.profile.credits = 3  # Reset credits to default for free plan
    user.profile.save()

    messages.success(request, "Your account has been reverted to the Free Plan.")
    return redirect('/dashboard')  # Redirect to dashboard or any appropriate page

@login_required
def delete_account(request):
    # Delete the user's account
    user = request.user
    user.delete()

    messages.success(request, "Your account has been deleted.")
    return redirect(' ')  # Redirect to the home page after deletion

def signout_view(request):
    logout(request)
    return HttpResponseRedirect("/") 


# Retrieve the API key from the environment
API_KEY = os.getenv('AI_API_KEY')
API_URL = 'https://api.dify.ai/v1/chat-messages'  # Updated API URL

@csrf_exempt
async def analyze_url(request):
    if request.method == 'POST':
        try:
            # Parse the JSON request
            data = json.loads(request.body)
            url = data.get('url', '')
            html_content = data.get('html', '')

            # Get user and profile asynchronously using sync_to_async
            user = request.user
            profile = await sync_to_async(lambda: user.profile)()

            # Check for credits
            if profile.plan_type != 'business' and profile.credits <= 0:
                return JsonResponse({'error': 'Insufficient credits to perform this action.'}, status=403)

            # Validate URL input
            if not url:
                return JsonResponse({'error': 'URL is required'}, status=400)

            # Construct the payload for AI API
            payload = {
                "inputs": {
                    "url": url,
                    "html": html_content
                },
                "query": f"URL: {url}, HTML: {html_content}",
                "response_mode": "streaming",
                "user": user.username,
            }

            # Set up headers for the API request
            headers = {
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            }

            # Asynchronously make the request to the AI API using sync_to_async
            response = await sync_to_async(requests.post)(
                API_URL, headers=headers, data=json.dumps(payload), stream=True
            )

            # Process the response
            if response.status_code == 200:
                collected_thoughts = []
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        if decoded_line.startswith("data: "):
                            json_data = decoded_line[len("data: "):]
                            try:
                                parsed_json = json.loads(json_data)
                                if 'thought' in parsed_json:
                                    collected_thoughts.append(parsed_json['thought'])
                            except json.JSONDecodeError:
                                pass

                # Deduct credits (if applicable) and save profile asynchronously
                if profile.plan_type != 'business':
                    profile.credits -= 1
                    await sync_to_async(profile.save)()

                return JsonResponse({'outputs': collected_thoughts}, status=200) if collected_thoughts else JsonResponse({'message': 'No outputs found.'}, status=200)
            else:
                return JsonResponse({
                    'error': f'AI API failed with status code {response.status_code}',
                    'response': response.text
                }, status=response.status_code)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method. Only POST is allowed.'}, status=405)