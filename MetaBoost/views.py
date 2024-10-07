from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .forms import LoginForm, SignupForm

def home(request):
    return render(request, 'index.html')

def login_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/")
    
    if request.method == "POST":
        login_form = LoginForm(request.POST)
        if login_form.is_valid():
            authenticated_user = authenticate(request, username=login_form.cleaned_data.get("username"), password=login_form.cleaned_data.get("password"))
            if authenticated_user is not None:
                login(request=request, user=authenticated_user)
            return HttpResponseRedirect("/")


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
            return HttpResponseRedirect("/")

    return render(request, 'signup.html')

def signout_view(request):
    logout(request)
    return HttpResponseRedirect("/") 