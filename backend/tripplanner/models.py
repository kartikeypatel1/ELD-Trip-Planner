from django.db import models
from django.contrib.auth.models import User

class Trip(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips')
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    cycle_hours_used = models.FloatField()
    distance_miles = models.FloatField()
    duration_hours = models.FloatField()
    shipper = models.CharField(max_length=255, blank=True)
    commodity = models.CharField(max_length=255, blank=True)
    load_number = models.CharField(max_length=100, blank=True)
    schedule = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.current_location} to {self.dropoff_location}"
