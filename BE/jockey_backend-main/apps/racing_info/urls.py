from django.urls import path
from . import views

urlpatterns = [
    path('calendar/', views.calendar),
    path('meetings/<int:pk>/', views.meeting_detail),
    path('races/<int:pk>/', views.program),
    path('horses/<int:pk>/', views.horse_detail),
    path('directory/<str:kind>/', views.directory),
    path('people/<str:kind>/<int:pk>/', views.person_detail),
    path('results/', views.results),
    path('events/<int:pk>/', views.event_detail),
    path('access/', views.access),
]
