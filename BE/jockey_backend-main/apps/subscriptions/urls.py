from django.urls import path
from . import views

urlpatterns = [path('plans/', views.plans), path('status/', views.status),
               path('checkout/', views.checkout), path('confirm-preview/', views.confirm_preview)]
