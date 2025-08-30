import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const TripMap = ({ tripResult }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && tripResult?.route?.all_coordinates) {
      const map = mapRef.current;
      const coordinates = tripResult.route.all_coordinates;
      
      if (coordinates.length > 1) {
        const bounds = L.latLngBounds(coordinates);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [tripResult]);

  if (!tripResult?.route?.all_coordinates) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Route</h3>
        <div className="bg-gray-100 rounded-lg p-8 min-h-96 flex items-center justify-center">
          <p className="text-gray-500">No route data available</p>
        </div>
      </div>
    );
  }

  const coordinates = tripResult.route.all_coordinates;
  const legs = tripResult.route.legs;

  // Create custom icons for different points with direction indicators
  const createCustomIcon = (color, isStart = false, isEnd = false) => {
    let html = '';
    if (isStart) {
      html = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;">
                <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background-color: ${color}; color: white; font-size: 10px; padding: 2px 4px; border-radius: 3px; white-space: nowrap;">START</div>
              </div>`;
    } else if (isEnd) {
      html = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); position: relative;">
                <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background-color: ${color}; color: white; font-size: 10px; padding: 2px 4px; border-radius: 3px; white-space: nowrap;">END</div>
              </div>`;
    } else {
      html = `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
    }
    
    return L.divIcon({
      className: 'custom-marker',
      html: html,
      iconSize: isStart || isEnd ? [24, 24] : [20, 20],
      iconAnchor: isStart || isEnd ? [12, 12] : [10, 10],
    });
  };

  const startIcon = createCustomIcon('#3B82F6', true); // Blue for start
  const pickupIcon = createCustomIcon('#10B981'); // Green for pickup
  const endIcon = createCustomIcon('#EF4444', false, true); // Red for end

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Trip Route</h3>
      
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span>Start: {tripResult.route.legs[0]?.from}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
            <span>Pickup: {tripResult.route.legs[0]?.to}</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span>Destination: {tripResult.route.legs[1]?.to}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <MapContainer
          ref={mapRef}
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4}
          style={{ height: '400px', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Start Marker */}
          {coordinates[0] && (
            <Marker position={coordinates[0]} icon={startIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Start</strong><br />
                  {tripResult.route.legs[0]?.from}<br />
                  <small className="text-gray-500">Current Location</small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pickup Marker */}
          {coordinates[1] && (
            <Marker position={coordinates[1]} icon={pickupIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Pickup</strong><br />
                  {tripResult.route.legs[0]?.to}<br />
                  <small className="text-gray-500">
                    Distance: {Math.round(tripResult.route.legs[0]?.distance_miles)} miles<br />
                    Duration: {Math.round(tripResult.route.legs[0]?.duration_hours * 10) / 10} hours
                  </small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* End Marker */}
          {coordinates[2] && (
            <Marker position={coordinates[2]} icon={endIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Destination</strong><br />
                  {tripResult.route.legs[1]?.to}<br />
                  <small className="text-gray-500">
                    Distance: {Math.round(tripResult.route.legs[1]?.distance_miles)} miles<br />
                    Duration: {Math.round(tripResult.route.legs[1]?.duration_hours * 10) / 10} hours
                  </small>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Lines with Direction Arrows */}
          {legs.map((leg, index) => (
            <Polyline
              key={index}
              positions={leg.coordinates}
              color={index === 0 ? '#3B82F6' : '#10B981'}
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          ))}
          
          {/* Direction Arrows */}
          {legs.map((leg, index) => {
            const midPoint = [
              (leg.coordinates[0][0] + leg.coordinates[1][0]) / 2,
              (leg.coordinates[0][1] + leg.coordinates[1][1]) / 2
            ];
            
            return (
              <Marker
                key={`arrow-${index}`}
                position={midPoint}
                icon={L.divIcon({
                  className: 'direction-arrow',
                  html: `<div style="background-color: ${index === 0 ? '#3B82F6' : '#10B981'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${index === 0 ? '→' : '→'}
                  </div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Route Summary */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Route Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Distance</div>
            <div className="font-semibold">{Math.round(tripResult.route.total_distance)} miles</div>
          </div>
          <div>
            <div className="text-gray-600">Driving Time</div>
            <div className="font-semibold">{Math.round(tripResult.route.total_driving_time * 10) / 10} hours</div>
          </div>
          <div>
            <div className="text-gray-600">Fuel Stops</div>
            <div className="font-semibold">{tripResult.route.fuel_stops}</div>
          </div>
          <div>
            <div className="text-gray-600">Rest Stops</div>
            <div className="font-semibold">{tripResult.route.required_rest_stops.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripMap;
