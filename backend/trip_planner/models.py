from django.db import models
from datetime import datetime, timedelta

class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_hours = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Trip from {self.pickup_location} to {self.dropoff_location}"

class ELDLog(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    total_miles = models.IntegerField()
    driver_name = models.CharField(max_length=100, default="Driver")
    carrier_name = models.CharField(max_length=100, default="Transport Co.")
    
    # Time slots (24 hours in 15-minute increments = 96 slots)
    time_slots = models.JSONField()  # Array of duty status for each 15-min slot
    
    # Daily totals
    off_duty_hours = models.FloatField(default=0)
    sleeper_berth_hours = models.FloatField(default=0)
    driving_hours = models.FloatField(default=0)
    on_duty_hours = models.FloatField(default=0)
    
    # Locations and remarks
    remarks = models.JSONField(default=list)
    
    def __str__(self):
        return f"ELD Log for {self.date}"
