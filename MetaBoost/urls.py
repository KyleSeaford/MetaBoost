"""
URL configuration for MetaBoost project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from MetaBoost import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='Home'),
    path('login/', views.login_view, name='Login'),
    path('signup/', views.signup_view, name='Signup'),
    path('logout', views.signout_view, name='Logout'),
    path('dashboard/', views.dash, name='dash'),
    path('legal/', views.legal, name='legal'),
    path('support/', views.support, name='support'),
    path('analyze-url/', views.analyze_url, name='analyze_url'),
]
