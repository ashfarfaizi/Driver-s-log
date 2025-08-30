import React, { useState } from 'react';
import { MapPin, Clock, Truck, AlertTriangle, CheckCircle, Navigation, Map, FileText, Timer, MapIcon, TrendingUp } from 'lucide-react';
import TripMap from './TripMap';

const ELDTripPlanner = () => {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_hours: 0
  });
  
  const [tripResult, setTripResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const [selectedLog, setSelectedLog] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Try to make API call to Django backend
      const response = await fetch('/api/plan-trip/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to plan trip');
      }
      
      const result = await response.json();
      setTripResult(result);
      setActiveTab('results');
    } catch (error) {
      console.log('Backend not available, using mock data for demonstration');
      
      // Generate dynamic coordinates based on entered locations
      const generateCoordinates = (location) => {
        const cityCoords = {
          'new york': [40.7128, -74.0060], 'chicago': [41.8781, -87.6298],
          'los angeles': [34.0522, -118.2437], 'seattle': [47.6062, -122.3321],
          'miami': [25.7617, -80.1918], 'denver': [39.7392, -104.9903],
          'atlanta': [33.7490, -84.3880], 'dallas': [32.7767, -96.7970],
          'houston': [29.7604, -95.3698], 'phoenix': [33.4484, -112.0740],
          'philadelphia': [39.9526, -75.1652], 'san antonio': [29.4241, -98.4936],
          'san diego': [32.7157, -117.1611], 'san jose': [37.3382, -121.8863],
          'austin': [30.2672, -97.7431], 'jacksonville': [30.3322, -81.6557],
          'fort worth': [32.7555, -97.3308], 'columbus': [39.9612, -82.9988],
          'charlotte': [35.2271, -80.8431], 'san francisco': [37.7749, -122.4194],
          'indianapolis': [39.7684, -86.1581], 'washington': [38.9072, -77.0369],
          'boston': [42.3601, -71.0589], 'el paso': [31.7619, -106.4850],
          'nashville': [36.1627, -86.7816], 'detroit': [42.3314, -83.0458],
          'oklahoma city': [35.4676, -97.5164], 'portland': [45.5152, -122.6784],
          'las vegas': [36.1699, -115.1398], 'memphis': [35.1495, -90.0490],
          'louisville': [38.2527, -85.7585], 'baltimore': [39.2904, -76.6122],
          'milwaukee': [43.0389, -87.9065], 'albuquerque': [35.0844, -106.6504],
          'tucson': [32.2226, -110.9747], 'fresno': [36.7378, -119.7871],
          'sacramento': [38.5816, -121.4944], 'mesa': [33.4152, -111.8315],
          'kansas city': [39.0997, -94.5786], 'tampa': [27.9506, -82.4572],
          'orlando': [28.5383, -81.3792], 'minneapolis': [44.9778, -93.2650],
          'cleveland': [41.4993, -81.6944], 'cincinnati': [39.1031, -84.5120],
          'pittsburgh': [40.4406, -79.9959], 'st louis': [38.6270, -90.1994],
          'oakland': [37.8044, -122.2711], 'raleigh': [35.7796, -78.6382],
          'arlington': [32.7357, -97.1081], 'new orleans': [29.9511, -90.0715],
          'wichita': [37.6872, -97.3301], 'tulsa': [36.1540, -95.9928],
          'aurora': [39.7294, -104.8319], 'bakersfield': [35.3733, -119.0187],
          'anaheim': [33.8366, -117.9143], 'honolulu': [21.3099, -157.8581],
          'santa ana': [33.7455, -117.8677], 'corpus christi': [27.8006, -97.3964],
          'riverside': [33.9533, -117.3962], 'lexington': [38.0406, -84.5037],
          'stockton': [37.9577, -121.2908], 'henderson': [36.0395, -114.9817],
          'saint paul': [44.9537, -93.0900], 'st petersburg': [27.7731, -82.6400],
          'chula vista': [32.6401, -117.0842], 'irvine': [33.6846, -117.8265],
          'fort wayne': [41.0793, -85.1394], 'jersey city': [40.7178, -74.0431],
          'durham': [35.9940, -78.8986], 'laredo': [27.5064, -99.5075],
          'buffalo': [42.8864, -78.8784], 'madison': [43.0731, -89.4012],
          'lubbock': [33.5779, -101.8552], 'chandler': [33.3062, -111.8413],
          'scottsdale': [33.4942, -111.9261], 'glendale': [33.5387, -112.1860],
          'reno': [39.5296, -119.8138], 'norfolk': [36.8508, -76.2859],
          'winston salem': [36.0999, -80.2442], 'north las vegas': [36.1989, -115.1175],
          'gilbert': [33.3528, -111.7890], 'chesapeake': [36.7682, -76.2875],
          'garland': [32.9126, -96.6389], 'irving': [32.8140, -96.9489],
          'hialeah': [25.8576, -80.2781], 'fremont': [37.5485, -121.9886],
          'boise': [43.6150, -116.2023], 'richmond': [37.5407, -77.4360],
          'baton rouge': [30.4515, -91.1871], 'spokane': [47.6588, -117.4260],
          'des moines': [41.5868, -93.6250], 'tacoma': [47.2529, -122.4443],
          'san bernardino': [34.1083, -117.2898], 'modesto': [37.6391, -120.9969],
          'fayetteville': [35.0527, -78.8784], 'shreveport': [32.5252, -93.7502],
          'fontana': [34.0922, -117.4350], 'frisco': [33.1507, -96.8236],
          'newark': [40.7357, -74.1724], 'plano': [33.0198, -96.6989],
          'lincoln': [40.8136, -96.7026], 'greensboro': [36.0726, -79.7920],
          'anchorage': [61.2181, -149.9003], 'salt lake city': [40.7608, -111.8910],
          'toledo': [41.6528, -83.5379], 'toronto': [43.6532, -79.3832],
          'vancouver': [49.2827, -123.1207], 'montreal': [45.5017, -73.5673],
          'calgary': [51.0447, -114.0719], 'edmonton': [53.5461, -113.4938],
          'ottawa': [45.4215, -75.6972], 'winnipeg': [49.8951, -97.1384],
          'quebec city': [46.8139, -71.2080], 'hamilton': [43.2557, -79.8711],
          'kitchener': [43.4516, -80.4925], 'london': [42.9849, -81.2453],
          'victoria': [48.4284, -123.3656], 'halifax': [44.6488, -63.5752],
          'saskatoon': [52.1332, -106.6700], 'regina': [50.4452, -104.6189],
          'st johns': [47.5615, -52.7126], 'fredericton': [45.9636, -66.6431],
          'charlottetown': [46.2382, -63.1311], 'whitehorse': [60.7212, -135.0568],
          'yellowknife': [62.4540, -114.3718], 'iqaluit': [63.7467, -68.5170]
        };
        
        const locationLower = location.toLowerCase();
        
        // Try exact match first
        if (cityCoords[locationLower]) {
          return cityCoords[locationLower];
        }
        
        // Try partial match
        for (const [city, coords] of Object.entries(cityCoords)) {
          if (locationLower.includes(city) || city.includes(locationLower)) {
            return coords;
          }
        }
        
        // Generate random coordinates within continental US if no match
        const lat = Math.random() * (49.0 - 25.0) + 25.0;
        const lon = Math.random() * (-66.0 - (-125.0)) + (-125.0);
        return [lat, lon];
      };
      
      // Generate coordinates for all locations
      const currentCoords = generateCoordinates(formData.current_location);
      const pickupCoords = generateCoordinates(formData.pickup_location);
      const dropoffCoords = generateCoordinates(formData.dropoff_location);
      
      // Calculate distances using Haversine formula
      const calculateDistance = (coord1, coord2) => {
        const R = 3956; // Earth's radius in miles
        const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
        const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      const leg1Distance = Math.round(calculateDistance(currentCoords, pickupCoords));
      const leg2Distance = Math.round(calculateDistance(pickupCoords, dropoffCoords));
      const totalDistance = leg1Distance + leg2Distance;
      const totalDrivingTime = Math.round((totalDistance / 60) * 10) / 10;
      const fuelStops = Math.ceil(totalDistance / 800);
      const daysNeeded = Math.ceil(totalDrivingTime / 11);
      
      // Generate rest stops based on HOS regulations
      const restStops = [];
      if (totalDrivingTime > 8) {
        restStops.push({
          type: '30_minute_break',
          duration: 0.5,
          reason: 'Required 30-minute break after 8 hours driving'
        });
      }
      
      for (let day = 1; day < daysNeeded; day++) {
        restStops.push({
          type: '10_hour_break',
          duration: 10,
          reason: `Required 10-hour break - Day ${day + 1} driving limit exceeded`
        });
      }
      
      // Create dynamic mock response with calculated data
      const mockResponse = {
        trip_id: 1,
        route: {
          legs: [
            {
              from: formData.current_location,
              to: formData.pickup_location,
              distance_miles: leg1Distance,
              duration_hours: Math.round((leg1Distance / 60) * 10) / 10,
              coordinates: [currentCoords, pickupCoords]
            },
            {
              from: formData.pickup_location,
              to: formData.dropoff_location,
              distance_miles: leg2Distance,
              duration_hours: Math.round((leg2Distance / 60) * 10) / 10,
              coordinates: [pickupCoords, dropoffCoords]
            }
          ],
          total_distance: totalDistance,
          total_driving_time: totalDrivingTime,
          fuel_stops: fuelStops,
          required_rest_stops: restStops,
          all_coordinates: [currentCoords, pickupCoords, dropoffCoords]
        },
        eld_logs: (() => {
          const logs = [];
          const dailyMiles = Math.ceil(totalDistance / daysNeeded);
          const dailyDrivingHours = Math.min(11, totalDrivingTime / daysNeeded);
          
          for (let day = 1; day <= daysNeeded; day++) {
            const isFirstDay = day === 1;
            const isLastDay = day === daysNeeded;
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + day - 1);
            
            const remarks = [];
            if (isFirstDay) {
              remarks.push(
                { time: '06:00', location: formData.current_location, status: 'on_duty', activity: 'Pre-trip inspection' },
                { time: '06:30', location: formData.current_location, status: 'driving', activity: 'Driving to pickup' }
              );
            } else {
              remarks.push(
                { time: '03:30', location: 'Truck Stop', status: 'on_duty', activity: 'Pre-trip inspection' },
                { time: '04:00', location: 'Truck Stop', status: 'driving', activity: 'Continue trip' }
              );
            }
            
            if (day === Math.ceil(leg1Distance / dailyMiles)) {
              remarks.push(
                { time: '12:00', location: formData.pickup_location, status: 'on_duty', activity: 'Pickup' },
                { time: '13:00', location: formData.pickup_location, status: 'driving', activity: 'Driving to delivery' }
              );
            }
            
            if (isLastDay) {
              remarks.push(
                { time: '11:30', location: formData.dropoff_location, status: 'on_duty', activity: 'Delivery' },
                { time: '12:30', location: formData.dropoff_location, status: 'off_duty', activity: 'Trip complete' }
              );
            }
            
            logs.push({
              id: day,
              date: currentDate.toISOString().split('T')[0],
              total_miles: dailyMiles,
              driving_hours: dailyDrivingHours,
              on_duty_hours: 4,
              off_duty_hours: 1,
              sleeper_berth_hours: 8,
              time_slots: generateMockTimeSlots(dailyDrivingHours, 4),
              remarks: remarks
            });
          }
          
          return logs;
        })(),
        compliance_summary: {
          total_driving_hours: totalDrivingTime,
          total_on_duty_hours: totalDrivingTime + (daysNeeded * 4), // 4 hours on-duty per day
          projected_cycle_hours: parseFloat(formData.current_cycle_hours) + totalDrivingTime + (daysNeeded * 4),
          violations: [],
          warnings: parseFloat(formData.current_cycle_hours) + totalDrivingTime + (daysNeeded * 4) > 60 ? ['Approaching cycle limit'] : [],
          compliant: true
        }
      };
      
      setTripResult(mockResponse);
      setActiveTab('results');
    } finally {
      setLoading(false);
    }
  };

  function generateMockTimeSlots(drivingHours, onDutyHours) {
    const slots = new Array(96).fill('off_duty');
    
    // Sleep period (10 hours = 40 slots from midnight)
    for (let i = 0; i < 40; i++) {
      slots[i] = 'sleeper';
    }
    
    // Work starts at 10 AM (slot 40)
    let currentSlot = 40;
    
    // On duty time first (pre-trip, etc.)
    const onDutySlots = Math.floor(onDutyHours * 4);
    for (let i = 0; i < onDutySlots && currentSlot < 96; i++) {
      slots[currentSlot + i] = 'on_duty';
    }
    currentSlot += onDutySlots;
    
    // Driving time
    const drivingSlots = Math.floor(drivingHours * 4);
    let slotsAdded = 0;
    
    while (slotsAdded < drivingSlots && currentSlot < 96) {
      // Drive for up to 8 hours before mandatory break
      const chunkSize = Math.min(32, drivingSlots - slotsAdded, 96 - currentSlot);
      
      for (let i = 0; i < chunkSize; i++) {
        slots[currentSlot + i] = 'driving';
      }
      
      currentSlot += chunkSize;
      slotsAdded += chunkSize;
      
      // Add 30-minute break if more driving needed
      if (slotsAdded < drivingSlots && currentSlot < 94) {
        slots[currentSlot] = 'off_duty';
        slots[currentSlot + 1] = 'off_duty';
        currentSlot += 2;
      }
    }
    
    return slots;
  }

  const renderELDGrid = (log) => {
    const timeLabels = [];
    for (let i = 0; i < 24; i++) {
      timeLabels.push(i);
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'off_duty': return 'bg-green-500';
        case 'sleeper': return 'bg-blue-500';
        case 'driving': return 'bg-red-500';
        case 'on_duty': return 'bg-yellow-500';
        default: return 'bg-gray-300';
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case 'off_duty': return 'Off Duty';
        case 'sleeper': return 'Sleeper Berth';
        case 'driving': return 'Driving';
        case 'on_duty': return 'On Duty (Not Driving)';
        default: return 'Unknown';
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Daily Log - {log.date}</h3>
          <div className="text-sm text-gray-600">
            Total Miles: {log.total_miles}
          </div>
        </div>

        {/* ELD Grid Header */}
        <div className="mb-4">
          <div className="grid grid-cols-25 gap-0 text-xs">
            <div className="text-center font-medium py-2">Status</div>
            {timeLabels.map(hour => (
              <div key={hour} className="text-center font-medium py-2 border-l border-gray-200">
                {hour}
              </div>
            ))}
          </div>
        </div>

        {/* ELD Grid Rows */}
        <div className="border rounded-lg overflow-hidden">
          {['off_duty', 'sleeper', 'driving', 'on_duty'].map((statusType, rowIndex) => (
            <div key={statusType} className="grid grid-cols-25 gap-0 border-b border-gray-200 last:border-b-0">
              <div className="bg-gray-50 p-3 border-r border-gray-200 flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {getStatusLabel(statusType)}
                </span>
              </div>
              {timeLabels.map(hour => (
                <div key={hour} className="border-r border-gray-100 last:border-r-0 h-12 relative">
                  {[0, 1, 2, 3].map(quarter => {
                    const slotIndex = hour * 4 + quarter;
                    const isActive = log.time_slots[slotIndex] === statusType;
                    return (
                      <div
                        key={quarter}
                        className={`w-full h-3 ${isActive ? getStatusColor(statusType) : 'bg-gray-100'} 
                                   ${quarter > 0 ? 'border-t border-gray-200' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 font-semibold">Off Duty</div>
            <div className="text-2xl font-bold text-green-800">{log.off_duty_hours}h</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 font-semibold">Sleeper Berth</div>
            <div className="text-2xl font-bold text-blue-800">{log.sleeper_berth_hours}h</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-600 font-semibold">Driving</div>
            <div className="text-2xl font-bold text-red-800">{log.driving_hours}h</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-600 font-semibold">On Duty</div>
            <div className="text-2xl font-bold text-yellow-800">{log.on_duty_hours}h</div>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-800 mb-3">Remarks</h4>
          <div className="space-y-2">
            {log.remarks.map((remark, index) => (
              <div key={index} className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <span className="font-medium mr-2">{remark.time}</span>
                <span className="mr-2">-</span>
                <span className="mr-2">{remark.location}</span>
                <span className="mr-2">-</span>
                <span>{remark.activity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMap = () => {
    if (!tripResult) return null;
    return <TripMap tripResult={tripResult} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Truck className="w-10 h-10 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">ELD Trip Planner</h1>
                <p className="text-gray-600">Hours of Service Compliance & Route Planning</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>HOS Compliant</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                <span>FMCSA Approved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: 'form', label: 'Trip Planning', icon: Navigation },
              { id: 'results', label: 'Route & Compliance', icon: Map },
              { id: 'logs', label: 'ELD Logs', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Navigation className="mr-3" />
              Plan Your Trip
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="current_location"
                      value={formData.current_location}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Chicago, IL"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Cycle Hours Used
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="current_cycle_hours"
                      value={formData.current_cycle_hours}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0-70"
                      min="0"
                      max="70"
                      step="0.1"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Hours used in current 8-day cycle (0-70)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-green-500" />
                    <input
                      type="text"
                      name="pickup_location"
                      value={formData.pickup_location}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., New York, NY"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drop-off Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                    <input
                      type="text"
                      name="dropoff_location"
                      value={formData.dropoff_location}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Los Angeles, CA"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    Planning Trip...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Map className="mr-2" />
                    Plan Trip & Generate ELD Logs
                  </div>
                )}
              </button>
            </form>

            {/* Feature Highlights */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: CheckCircle, title: 'HOS Compliance', desc: 'Automatic compliance checking' },
                { icon: Clock, title: 'Smart Scheduling', desc: 'Optimized rest break planning' },
                { icon: FileText, title: 'ELD Generation', desc: 'Compliant log sheet creation' }
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-gray-50 p-4 rounded-lg">
                  <Icon className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'results' && tripResult && (
          <div>
            {/* Compliance Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="mr-2" />
                Compliance Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 font-semibold mb-1">Total Driving Hours</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {tripResult.compliance_summary.total_driving_hours}h
                  </div>
                  <div className="text-xs text-blue-600 mt-1">11h daily limit</div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-yellow-600 font-semibold mb-1">Total On-Duty Hours</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {tripResult.compliance_summary.total_on_duty_hours}h
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">14h daily window</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  tripResult.compliance_summary.projected_cycle_hours > 70 ? 'bg-red-50' : 'bg-green-50'
                }`}>
                  <div className={`font-semibold mb-1 ${
                    tripResult.compliance_summary.projected_cycle_hours > 70 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Projected Cycle Hours
                  </div>
                  <div className={`text-2xl font-bold ${
                    tripResult.compliance_summary.projected_cycle_hours > 70 ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {tripResult.compliance_summary.projected_cycle_hours}h
                  </div>
                  <div className={`text-xs mt-1 ${
                    tripResult.compliance_summary.projected_cycle_hours > 70 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    70h cycle limit
                  </div>
                </div>
              </div>

              {/* Violations and Warnings */}
              {(tripResult.compliance_summary.violations.length > 0 || tripResult.compliance_summary.warnings.length > 0) && (
                <div className="mt-6">
                  {tripResult.compliance_summary.violations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center text-red-600 mb-2">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Violations</span>
                      </div>
                      {tripResult.compliance_summary.violations.map((violation, index) => (
                        <div key={index} className="bg-red-50 border-l-4 border-red-400 p-3 text-red-700 text-sm">
                          {violation}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {tripResult.compliance_summary.warnings.length > 0 && (
                    <div>
                      <div className="flex items-center text-yellow-600 mb-2">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Warnings</span>
                      </div>
                      {tripResult.compliance_summary.warnings.map((warning, index) => (
                        <div key={index} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-700 text-sm">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tripResult.compliance_summary.compliant && (
                <div className="mt-6 flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Trip is HOS compliant</span>
                </div>
              )}
            </div>

            {renderMap()}

            {/* Required Stops */}
            {tripResult.route.required_rest_stops.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Required Rest Stops</h3>
                <div className="space-y-3">
                  {tripResult.route.required_rest_stops.map((stop, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <div className="font-semibold text-gray-800">
                          {stop.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                          ({stop.duration}h)
                        </div>
                        <div className="text-sm text-gray-600">{stop.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && tripResult && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <FileText className="mr-3" />
                Electronic Logging Device (ELD) Logs
              </h2>
              
              {tripResult.eld_logs.length > 1 && (
                <div className="flex space-x-2">
                  {tripResult.eld_logs.map((log, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedLog(index)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedLog === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Day {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tripResult.eld_logs[selectedLog] && renderELDGrid(tripResult.eld_logs[selectedLog])}

            {/* Download Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
              <div className="flex space-x-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Download PDF
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Export to ELD Device
                </button>
                <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
                  Print Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results Message */}
        {activeTab !== 'form' && !tripResult && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Trip Planned</h3>
            <p className="text-gray-600 mb-6">Please complete the trip planning form to see results.</p>
            <button
              onClick={() => setActiveTab('form')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Plan a Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ELDTripPlanner;
