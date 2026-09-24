from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import traceback

from .routing import geocode, get_route
from .hos_engine import generate_eld_schedule
from .models import Trip


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plan_trip(request):
    data = request.data
    required = ['current_location', 'pickup_location', 'dropoff_location', 'cycle_hours_used']
    missing = [f for f in required if f not in data or data[f] in (None, '')]
    if missing:
        return Response(
            {'error': f"Missing fields: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        cycle_hours_used = float(data['cycle_hours_used'])
    except (TypeError, ValueError):
        return Response({'error': 'cycle_hours_used must be a number'}, status=400)
    if not 0 <= cycle_hours_used < 70:
        return Response(
            {'error': 'cycle_hours_used must be between 0 and 70 hours'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        current_coord = geocode(data['current_location'])
        pickup_coord = geocode(data['pickup_location'])
        dropoff_coord = geocode(data['dropoff_location'])
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        traceback.print_exc()  # <-- ab poora error terminal me dikhega
        return Response({'error': f'Geocoding failed: {e}'}, status=502)

    try:
        route = get_route([current_coord, pickup_coord, dropoff_coord])
    except Exception as e:
        traceback.print_exc()
        return Response({'error': f'Routing failed: {e}'}, status=502)

    schedule = generate_eld_schedule(
        total_drive_hours=route['duration_hours'],
        total_distance_miles=route['distance_miles'],
        cycle_hours_used=cycle_hours_used,
    )
    try:
        Trip.objects.create(
            user=request.user,
            current_location=data['current_location'],
            pickup_location=data['pickup_location'],
            dropoff_location=data['dropoff_location'],
            cycle_hours_used=cycle_hours_used,
            distance_miles=route['distance_miles'],
            duration_hours=route['duration_hours'],
            shipper=data.get('shipper', ''),
            commodity=data.get('commodity', ''),
            load_number=data.get('load_number', ''),
            schedule=schedule,
        )
    except Exception:
        traceback.print_exc()
        return Response(
            {'error': 'Trip was calculated but could not be saved to SQLite.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({
        'route': {
            'geometry': route['geometry'],
            'distance_miles': route['distance_miles'],
            'duration_hours': route['duration_hours'],
            'instructions': route['instructions'],
            'stops': [
                {'type': 'current', 'label': data['current_location'], 'coordinates': current_coord},
                {'type': 'pickup', 'label': data['pickup_location'], 'coordinates': pickup_coord},
                {'type': 'dropoff', 'label': data['dropoff_location'], 'coordinates': dropoff_coord},
            ],
        },
        'schedule': schedule,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_trips(request):
    try:
        trips = Trip.objects.filter(user=request.user).order_by('-created_at')
        trip_data = []
        for trip in trips:
            schedule = trip.schedule or generate_eld_schedule(
                total_drive_hours=trip.duration_hours,
                total_distance_miles=trip.distance_miles,
                cycle_hours_used=trip.cycle_hours_used,
            )
            trip_data.append({
                'id': trip.id,
                'current_location': trip.current_location,
                'pickup_location': trip.pickup_location,
                'dropoff_location': trip.dropoff_location,
                'cycle_hours_used': trip.cycle_hours_used,
                'distance_miles': trip.distance_miles,
                'duration_hours': trip.duration_hours,
                'shipper': trip.shipper,
                'commodity': trip.commodity,
                'load_number': trip.load_number,
                'created_at': trip.created_at,
                'schedule': schedule,
            })
        return Response(trip_data)
    except Exception:
        traceback.print_exc()
        return Response(
            {'error': 'Trips could not be loaded from SQLite.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )