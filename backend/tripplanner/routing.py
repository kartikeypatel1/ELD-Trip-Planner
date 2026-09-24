"""
OpenRouteService helper functions for the ELD Trip Planner.

Handles:
1. Geocoding place names into coordinates
2. Calculating driving routes
"""

import requests
from django.conf import settings


ORS_BASE = "https://api.openrouteservice.org"


def geocode(place_name):
    """
    Convert a place name into (longitude, latitude).
    """

    api_key = settings.ORS_API_KEY

    if not api_key:
        raise ValueError(
            "ORS_API_KEY is not configured. "
            "Add ORS_API_KEY=your_api_key to backend/.env"
        )

    response = requests.get(
        f"{ORS_BASE}/geocode/search",
        headers={
            "Authorization": api_key,
        },
        params={
            "text": place_name,
            "size": 1,
        },
        timeout=15,
    )

    # Helpful debugging information
    if not response.ok:
        print("\n========== ORS GEOCODING ERROR ==========")
        print("Status:", response.status_code)
        print("Response:", response.text)
        print("==========================================\n")

    response.raise_for_status()

    data = response.json()

    features = data.get("features", [])

    if not features:
        raise ValueError(
            f"Could not find location: {place_name}"
        )

    coordinates = features[0]["geometry"]["coordinates"]

    longitude = coordinates[0]
    latitude = coordinates[1]

    return longitude, latitude


def get_route(coords):
    """
    Calculate a driving route using OpenRouteService.

    coords format:

    [
        (longitude, latitude),
        (longitude, latitude),
        (longitude, latitude)
    ]
    """

    api_key = settings.ORS_API_KEY

    if not api_key:
        raise ValueError(
            "ORS_API_KEY is not configured. "
            "Add ORS_API_KEY=your_api_key to backend/.env"
        )

    if len(coords) < 2:
        raise ValueError(
            "At least two coordinates are required to calculate a route."
        )

    coordinates = [
        [longitude, latitude]
        for longitude, latitude in coords
    ]

    request_url = (
        f"{ORS_BASE}/v2/directions/driving-car/geojson"
    )

    payload = {
        "coordinates": coordinates,
        "instructions": True,
        "instructions_format": "text",

        # Search up to 2 km for a routable road
        # around each geocoded coordinate.
        "radiuses": [2000] * len(coordinates),
    }

    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/geo+json",
    }

    print("\n========== ORS ROUTE REQUEST ==========")
    print("URL:", request_url)
    print("Coordinates:", coordinates)
    print("=======================================\n")

    response = requests.post(
        request_url,
        headers=headers,
        json=payload,
        timeout=30,
    )

    if not response.ok:
        print("\n========== ORS ROUTING ERROR ==========")
        print("Status:", response.status_code)
        print("Response:", response.text)
        print("=======================================\n")

    response.raise_for_status()

    data = response.json()

    features = data.get("features", [])

    if not features:
        raise ValueError(
            "OpenRouteService returned no route."
        )

    feature = features[0]

    geometry = feature.get("geometry")

    properties = feature.get("properties", {})

    summary = properties.get("summary", {})

    distance_meters = summary.get("distance", 0)

    duration_seconds = summary.get("duration", 0)

    instructions = []
    for segment in properties.get("segments", []):
        for step in segment.get("steps", []):
            instructions.append({
                "instruction": step.get("instruction", ""),
                "name": step.get("name", ""),
                "distance_miles": round(float(step.get("distance", 0)) / 1609.34, 1),
                "duration_minutes": round(float(step.get("duration", 0)) / 60, 1),
            })

    distance_miles = distance_meters / 1609.34

    duration_hours = duration_seconds / 3600

    return {
        "geometry": geometry,
        "distance_miles": round(distance_miles, 1),
        "duration_hours": round(duration_hours, 2),
        "instructions": instructions,
    }