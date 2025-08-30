from django.contrib import admin
from .models import Trip, ELDLog

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['id', 'pickup_location', 'dropoff_location', 'current_cycle_hours', 'created_at']
    list_filter = ['created_at']

@admin.register(ELDLog)
class ELDLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'trip', 'date', 'total_miles', 'driving_hours', 'on_duty_hours']
    list_filter = ['date']
