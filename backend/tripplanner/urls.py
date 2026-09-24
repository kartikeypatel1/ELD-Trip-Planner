from django.urls import path
from .views import plan_trip, my_trips

urlpatterns = [
    path('plan-trip/', plan_trip, name='plan-trip'),
    path('my-trips/', my_trips, name='my-trips'),
]
