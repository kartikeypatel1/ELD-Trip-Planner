from django.db import models
from django.contrib.auth.models import User


class DriverProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='driver_profile'
    )
    driver_number = models.CharField(max_length=50, blank=True)
    initials = models.CharField(max_length=10, blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    carrier_name = models.CharField(max_length=200, blank=True)
    main_office_address = models.CharField(max_length=300, blank=True)
    home_terminal_address = models.CharField(max_length=300, blank=True)
    co_driver_name = models.CharField(max_length=200, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)
    trailer_number = models.CharField(max_length=50, blank=True)
    license_plate_number = models.CharField(max_length=50, blank=True)
    license_state = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Profile for {self.user.email}"
