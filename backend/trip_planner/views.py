import requests
import math
from datetime import datetime, timedelta, time
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Trip, ELDLog
from .serializers import TripSerializer, ELDLogSerializer

@api_view(['POST'])
def plan_trip(request):
    try:
        data = request.data
        
        # Create trip record
        trip = Trip.objects.create(
            current_location=data['current_location'],
            pickup_location=data['pickup_location'],
            dropoff_location=data['dropoff_location'],
            current_cycle_hours=float(data['current_cycle_hours'])
        )
        
        # Get route information
        route_data = get_route_with_stops(
            data['current_location'],
            data['pickup_location'],
            data['dropoff_location']
        )
        
        # Generate ELD logs
        eld_logs = generate_eld_logs(trip, route_data)
        
        return Response({
            'trip_id': trip.id,
            'route': route_data,
            'eld_logs': [ELDLogSerializer(log).data for log in eld_logs],
            'compliance_summary': get_compliance_summary(eld_logs, data['current_cycle_hours'])
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

def get_route_with_stops(current_loc, pickup_loc, dropoff_loc):
    """Get route information using OpenRouteService API"""
    
    # Geocode locations
    current_coords = geocode_location(current_loc)
    pickup_coords = geocode_location(pickup_loc)
    dropoff_coords = geocode_location(dropoff_loc)
    
    # Calculate distances
    leg1_distance = calculate_distance(current_coords, pickup_coords)
    leg2_distance = calculate_distance(pickup_coords, dropoff_coords)
    
    total_distance = leg1_distance + leg2_distance
    
    # Estimate driving time (assuming 60 mph average)
    total_driving_time = total_distance / 60
    
    # Calculate required stops
    fuel_stops = math.ceil(total_distance / 1000)  # Every 1000 miles
    rest_stops = calculate_required_rest_stops(total_driving_time)
    
    return {
        'legs': [
            {
                'from': current_loc,
                'to': pickup_loc,
                'distance_miles': leg1_distance,
                'duration_hours': leg1_distance / 60,
                'coordinates': [current_coords, pickup_coords]
            },
            {
                'from': pickup_loc,
                'to': dropoff_loc,
                'distance_miles': leg2_distance,
                'duration_hours': leg2_distance / 60,
                'coordinates': [pickup_coords, dropoff_coords]
            }
        ],
        'total_distance': total_distance,
        'total_driving_time': total_driving_time,
        'fuel_stops': fuel_stops,
        'required_rest_stops': rest_stops,
        'all_coordinates': [current_coords, pickup_coords, dropoff_coords]
    }

def geocode_location(location):
    """Simple geocoding - in production, use a real geocoding service"""
    # This is a simplified version - you'd use Google Maps API or similar
    geocoding_data = {
        'New York, NY': [40.7128, -74.0060],
        'Los Angeles, CA': [34.0522, -118.2437],
        'Chicago, IL': [41.8781, -87.6298],
        'Houston, TX': [29.7604, -95.3698],
        'Phoenix, AZ': [33.4484, -112.0740],
        'Philadelphia, PA': [39.9526, -75.1652],
        'San Antonio, TX': [29.4241, -98.4936],
        'San Diego, CA': [32.7157, -117.1611],
        'Dallas, TX': [32.7767, -96.7970],
        'San Jose, CA': [37.3382, -121.8863]
    }
    
    # Simple matching - in production, use proper geocoding
    for city, coords in geocoding_data.items():
        if city.lower() in location.lower():
            return coords
    
    # Default coordinates if not found
    return [39.8283, -98.5795]  # Center of USA

def calculate_distance(coord1, coord2):
    """Calculate distance between two coordinates in miles"""
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in miles
    r = 3956
    
    return c * r

def calculate_required_rest_stops(driving_time):
    """Calculate required rest stops based on HOS regulations"""
    stops = []
    
    # 30-minute break after 8 hours of driving
    if driving_time > 8:
        stops.append({
            'type': '30_minute_break',
            'duration': 0.5,
            'reason': 'Required 30-minute break after 8 hours driving'
        })
    
    # 10-hour break if driving time exceeds 11 hours (split over days)
    if driving_time > 11:
        stops.append({
            'type': '10_hour_break',
            'duration': 10,
            'reason': 'Required 10-hour break - daily driving limit exceeded'
        })
    
    return stops

def generate_eld_logs(trip, route_data):
    """Generate ELD logs for the trip"""
    logs = []
    
    total_driving_time = route_data['total_driving_time']
    current_date = datetime.now().date()
    
    # If trip is under 11 hours, single day log
    if total_driving_time <= 11:
        log = create_single_day_log(trip, route_data, current_date)
        logs.append(log)
    else:
        # Multi-day trip
        logs = create_multi_day_logs(trip, route_data, current_date)
    
    return logs

def create_single_day_log(trip, route_data, date):
    """Create a single day ELD log"""
    
    # Initialize 24-hour time slots (96 slots of 15 minutes each)
    time_slots = ['off_duty'] * 96  # 0 = off_duty, 1 = sleeper, 2 = driving, 3 = on_duty
    
    # Assume start at 6 AM (slot 24)
    start_slot = 24  # 6 AM
    
    # Pre-trip inspection (30 minutes)
    for i in range(start_slot, start_slot + 2):
        time_slots[i] = 'on_duty'
    
    current_slot = start_slot + 2
    
    # Driving to pickup (1 hour assumed + pickup time)
    pickup_slots = math.ceil(route_data['legs'][0]['duration_hours'] * 4)
    for i in range(current_slot, current_slot + pickup_slots):
        if i < 96:
            time_slots[i] = 'driving'
    
    current_slot += pickup_slots
    
    # Pickup time (1 hour)
    for i in range(current_slot, min(current_slot + 4, 96)):
        time_slots[i] = 'on_duty'
    
    current_slot += 4
    
    # Check if 30-minute break needed
    driving_time_so_far = pickup_slots * 0.25
    if driving_time_so_far >= 8:
        # Add 30-minute break
        for i in range(current_slot, min(current_slot + 2, 96)):
            time_slots[i] = 'off_duty'
        current_slot += 2
    
    # Driving to dropoff
    dropoff_slots = math.ceil(route_data['legs'][1]['duration_hours'] * 4)
    for i in range(current_slot, min(current_slot + dropoff_slots, 96)):
        time_slots[i] = 'driving'
    
    current_slot += dropoff_slots
    
    # Dropoff time (1 hour)
    for i in range(current_slot, min(current_slot + 4, 96)):
        time_slots[i] = 'on_duty'
    
    current_slot += 4
    
    # Post-trip inspection (30 minutes)
    for i in range(current_slot, min(current_slot + 2, 96)):
        time_slots[i] = 'on_duty'
    
    # Calculate totals
    driving_hours = time_slots.count('driving') * 0.25
    on_duty_hours = time_slots.count('on_duty') * 0.25
    off_duty_hours = time_slots.count('off_duty') * 0.25
    sleeper_hours = time_slots.count('sleeper') * 0.25
    
    # Create remarks
    remarks = [
        {'time': '06:00', 'location': trip.current_location, 'status': 'on_duty', 'activity': 'Pre-trip inspection'},
        {'time': '06:30', 'location': trip.current_location, 'status': 'driving', 'activity': 'Driving to pickup'},
        {'time': format_time_from_slot(start_slot + 2 + pickup_slots), 'location': trip.pickup_location, 'status': 'on_duty', 'activity': 'Pickup'},
        {'time': format_time_from_slot(current_slot - dropoff_slots - 6), 'location': trip.pickup_location, 'status': 'driving', 'activity': 'Driving to delivery'},
        {'time': format_time_from_slot(current_slot - 6), 'location': trip.dropoff_location, 'status': 'on_duty', 'activity': 'Delivery'},
        {'time': format_time_from_slot(current_slot - 2), 'location': trip.dropoff_location, 'status': 'off_duty', 'activity': 'Off duty'}
    ]
    
    log = ELDLog.objects.create(
        trip=trip,
        date=date,
        total_miles=int(route_data['total_distance']),
        time_slots=time_slots,
        driving_hours=driving_hours,
        on_duty_hours=on_duty_hours,
        off_duty_hours=off_duty_hours,
        sleeper_berth_hours=sleeper_hours,
        remarks=remarks
    )
    
    return log

def create_multi_day_logs(trip, route_data, start_date):
    """Create multiple day logs for longer trips"""
    logs = []
    
    total_driving_time = route_data['total_driving_time']
    days_needed = math.ceil(total_driving_time / 11)  # 11-hour daily driving limit
    
    for day in range(days_needed):
        current_date = start_date + timedelta(days=day)
        
        # Calculate driving time for this day
        remaining_time = total_driving_time - (day * 11)
        daily_driving_time = min(11, remaining_time)
        
        # Create simplified log for each day
        time_slots = ['off_duty'] * 96
        
        # 10 hours off duty (sleep)
        for i in range(0, 40):  # Midnight to 10 AM
            time_slots[i] = 'sleeper'
        
        # Work day starts at 10 AM
        start_slot = 40
        
        # Driving time (converted to slots)
        driving_slots = int(daily_driving_time * 4)
        
        current_slot = start_slot
        
        # Pre-trip
        for i in range(current_slot, current_slot + 2):
            if i < 96:
                time_slots[i] = 'on_duty'
        current_slot += 2
        
        # Driving with breaks
        slots_driven = 0
        while slots_driven < driving_slots and current_slot < 96:
            # Drive for up to 8 hours (32 slots) before break
            drive_chunk = min(32, driving_slots - slots_driven, 96 - current_slot)
            
            for i in range(current_slot, current_slot + drive_chunk):
                time_slots[i] = 'driving'
            
            current_slot += drive_chunk
            slots_driven += drive_chunk
            
            # Add 30-minute break if needed and more driving remains
            if slots_driven < driving_slots and current_slot < 94:
                for i in range(current_slot, current_slot + 2):
                    time_slots[i] = 'off_duty'
                current_slot += 2
        
        # Calculate totals
        driving_hours = time_slots.count('driving') * 0.25
        on_duty_hours = time_slots.count('on_duty') * 0.25
        off_duty_hours = time_slots.count('off_duty') * 0.25
        sleeper_hours = time_slots.count('sleeper') * 0.25
        
        # Simple remarks
        remarks = [
            {'time': '10:00', 'location': 'En route', 'status': 'on_duty', 'activity': f'Day {day + 1} pre-trip'},
            {'time': '10:30', 'location': 'En route', 'status': 'driving', 'activity': f'Driving day {day + 1}'},
        ]
        
        daily_miles = int(route_data['total_distance'] / days_needed)
        
        log = ELDLog.objects.create(
            trip=trip,
            date=current_date,
            total_miles=daily_miles,
            time_slots=time_slots,
            driving_hours=driving_hours,
            on_duty_hours=on_duty_hours,
            off_duty_hours=off_duty_hours,
            sleeper_berth_hours=sleeper_hours,
            remarks=remarks
        )
        
        logs.append(log)
    
    return logs

def format_time_from_slot(slot):
    """Convert slot number to time string"""
    if slot >= 96:
        slot = 95
    
    hour = slot // 4
    minute = (slot % 4) * 15
    
    return f"{hour:02d}:{minute:02d}"

def get_compliance_summary(logs, current_cycle_hours):
    """Generate compliance summary"""
    
    total_driving = sum(log.driving_hours for log in logs)
    total_on_duty = sum(log.driving_hours + log.on_duty_hours for log in logs)
    
    # Check violations
    violations = []
    warnings = []
    
    for log in logs:
        if log.driving_hours > 11:
            violations.append(f"Driving limit exceeded on {log.date}: {log.driving_hours} hours")
        
        if log.driving_hours + log.on_duty_hours > 14:
            violations.append(f"14-hour window exceeded on {log.date}")
    
    # Check 70-hour cycle
    projected_cycle_hours = current_cycle_hours + total_on_duty
    if projected_cycle_hours > 70:
        violations.append(f"70-hour cycle limit would be exceeded: {projected_cycle_hours} hours")
    
    if projected_cycle_hours > 60:
        warnings.append(f"Approaching cycle limit: {projected_cycle_hours}/70 hours")
    
    return {
        'total_driving_hours': total_driving,
        'total_on_duty_hours': total_on_duty,
        'projected_cycle_hours': projected_cycle_hours,
        'violations': violations,
        'warnings': warnings,
        'compliant': len(violations) == 0
    }

@api_view(['GET'])
def get_trip(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id)
        logs = trip.logs.all().order_by('date')
        
        return Response({
            'trip': TripSerializer(trip).data,
            'logs': [ELDLogSerializer(log).data for log in logs]
        })
        
    except Trip.DoesNotExist:
        return Response({'error': 'Trip not found'}, status=status.HTTP_404_NOT_FOUND)
