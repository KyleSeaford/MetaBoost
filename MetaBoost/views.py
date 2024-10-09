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
from dotenv import load_dotenv
import json
import os
import requests

# Load environment variables from a .env file
load_dotenv()

from .forms import LoginForm, SignupForm

def home(request):
    return render(request, 'index.html')

def dash(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/")

    return render(request, 'dash.html')

def login_view(request):
    if request.method == "POST":
        login_form = LoginForm(request.POST)
        if login_form.is_valid():
            authenticated_user = authenticate(request, username=login_form.cleaned_data.get("username"), password=login_form.cleaned_data.get("password"))
            if authenticated_user is not None:
                login(request=request, user=authenticated_user)
            return HttpResponseRedirect("/dashboard")

    return render(request, 'login.html')

def signup_view(request):
    if request.method == "POST":
        signup_form = SignupForm(request.POST)
        if signup_form.is_valid():
            if User.objects.filter(username = signup_form.cleaned_data.get("username")).first():
                return render(request, 'signup.html')
            
            user = User.objects.create_user(signup_form.cleaned_data.get("username"), password=signup_form.cleaned_data.get("password"))

            authenticated_user = authenticate(request, username=signup_form.cleaned_data.get("username"), password=signup_form.cleaned_data.get("password"))
            if authenticated_user is not None:
                login(request=request, user=authenticated_user)
            return HttpResponseRedirect("/dashboard")

    return render(request, 'signup.html')

def signout_view(request):
    logout(request)
    return HttpResponseRedirect("/") 


# Retrieve the API key from the environment
API_KEY = os.getenv('AI_API_KEY')
API_URL = 'https://api.dify.ai/v1/chat-messages'  # Updated API URL

@csrf_exempt
def analyze_url(request):
    if request.method == 'POST':
        try:
            # Parse the JSON request from the frontend
            data = json.loads(request.body)
            url = data.get('url', '')
            html_content = data.get('html', '')

            user = request.user  # Get the logged-in user

            # Print inputs for debugging
            print(f"URL Received: {url}")
            print(f"HTML Content Received: {html_content[:500]}")  # Print first 500 characters for reference

            if not url:
                return JsonResponse({'error': 'URL is required'}, status=400)

            # Construct the payload for the AI API request
            payload = {
                "inputs": {
                    "url": url,
                    "html": html_content
                },
                "query": f"URL: {url}, HTML: {html_content}",
                "response_mode": "streaming",
                "user": user.username,  # Use the logged-in user's username
            }

            # Print the payload for debugging
            print(f"Payload Sent to AI API: {json.dumps(payload, indent=4)}")

            # Set up headers for the API request
            headers = {
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            }

            # Make the POST request to the AI API and stream the response
            response = requests.post(API_URL, headers=headers, data=json.dumps(payload), stream=True)

            # Check if the response status is OK (status code 200)
            if response.status_code == 200:
                collected_thoughts = []  # Store all thoughts here
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        print(f"Streamed Line: {decoded_line}")  # Print each streamed line for debugging
                        if decoded_line.startswith("data: "):
                            json_data = decoded_line[len("data: "):]
                            try:
                                parsed_json = json.loads(json_data)
                                print(f"Parsed JSON: {json.dumps(parsed_json, indent=4)}")  # Print parsed JSON for debugging
                                
                                # Check for 'thought' key in the response and collect it
                                if 'thought' in parsed_json:
                                    thought = parsed_json['thought']
                                    print(f"Thought Collected: {thought}")  # Log the thought for debugging
                                    collected_thoughts.append(thought)

                            except json.JSONDecodeError as e:
                                print(f"Error decoding JSON: {e}")

                # Return the collected thoughts as a JSON response
                if collected_thoughts:
                    return JsonResponse({'outputs': collected_thoughts}, status=200)
                else:
                    return JsonResponse({'message': 'No outputs were found in the stream.'}, status=200)
            else:
                # Return error message with response text if status is not 200
                return JsonResponse({
                    'error': f'Request to AI API failed with status code: {response.status_code}',
                    'response': response.text
                }, status=response.status_code)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method. Only POST is allowed.'}, status=405)