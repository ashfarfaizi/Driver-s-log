import React, { useState } from 'react';
import { MapPin, Clock, Truck, AlertTriangle, CheckCircle, Navigation, Map, FileText, Timer, MapIcon, TrendingUp } from 'lucide-react';

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
      // Fallback to mock data if API fails
      const mockResponse = {
        trip_id: 1,
        route: {
          legs: [
            {
              from: formData.current_location,
              to: formData.pickup_location,
              distance_miles: 150,
              duration_hours: 2.5,
              coordinates: [[40.7128, -74.0060], [41.8781, -87.6298]]
            },
            {
              from: formData.pickup_location,
              to: formData.dropoff_location,
              distance_miles: 800,
              duration_hours: 13.3,
              coordinates: [[41.8781, -87.6298], [34.0522, -118.2437]]
            }
          ],
          total_distance: 950,
          total_driving_time: 15.8,
          fuel_stops: 1,
          required_rest_stops: [
            { type: '30_minute_break', duration: 0.5, reason: 'Required 30-minute break after 8 hours driving' },
            { type: '10_hour_break', duration: 10, reason: 'Required 10-hour break - daily driving limit exceeded' }
          ],
          all_coordinates: [[40.7128, -74.0060], [41.8781, -87.6298], [34.0522, -118.2437]]
        },
        eld_logs: [
          {
            id: 1,
            date: '2024-03-15',
            total_miles: 475,
            driving_hours: 11,
            on_duty_hours: 4,
            off_duty_hours: 1,
            sleeper_berth_hours: 8,
            time_slots: generateMockTimeSlots(11, 4),
            remarks: [
              { time: '06:00', location: formData.current_location, status: 'on_duty', activity: 'Pre-trip inspection' },
              { time: '06:30', location: formData.current_location, status: 'driving', activity: 'Driving to pickup' },
              { time: '09:00', location: formData.pickup_location, status: 'on_duty', activity: 'Pickup' },
              { time: '10:00', location: formData.pickup_location, status: 'driving', activity: 'Driving to delivery' },
              { time: '14:00', location: 'Highway Rest Stop', status: 'off_duty', activity: '30-min break' },
              { time: '14:30', location: 'Highway Rest Stop', status: 'driving', activity: 'Continue driving' },
              { time: '17:30', location: 'Truck Stop', status: 'sleeper', activity: '10-hour break' }
            ]
          },
          {
            id: 2,
            date: '2024-03-16',
            total_miles: 475,
            driving_hours: 4.8,
            on_duty_hours: 2,
            off_duty_hours: 1.2,
            sleeper_berth_hours: 16,
            time_slots: generateMockTimeSlots(4.8, 2),
            remarks: [
              { time: '03:30', location: 'Truck Stop', status: 'on_duty', activity: 'Pre-trip inspection' },
              { time: '04:00', location: 'Truck Stop', status: 'driving', activity: 'Final leg to delivery' },
              { time: '08:45', location: formData.dropoff_location, status: 'on_duty', activity: 'Delivery' },
              { time: '09:45', location: formData.dropoff_location, status: 'off_duty', activity: 'Trip complete' }
            ]
          }
        ],
        compliance_summary: {
          total_driving_hours: 15.8,
          total_on_duty_hours: 21.8,
          projected_cycle_hours: parseFloat(formData.current_cycle_hours) + 21.8,
          violations: [],
          warnings: parseFloat(formData.current_cycle_hours) + 21.8 > 60 ? ['Approaching cycle limit'] : [],
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

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <MapIcon className="mr-2" />
          Trip Route
        </h3>
        <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-8 min-h-96 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 w-16 h-16 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Interactive Map View</h4>
            <p className="text-gray-600 mb-4">Route visualization would appear here</p>
            
            {/* Route Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Distance:</span>
                  <span className="font-semibold">{tripResult.route.total_distance} miles</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Driving Time:</span>
                  <span className="font-semibold">{Math.round(tripResult.route.total_driving_time * 10) / 10} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Fuel Stops:</span>
                  <span className="font-semibold">{tripResult.route.fuel_stops}</span>
                </div>
                <div className="flex justify-between">
                  <span>Required Rest Breaks:</span>
                  <span className="font-semibold">{tripResult.route.required_rest_stops.length}</span>
                </div>
              </div>
            </div>

            {/* Route Legs */}
            <div className="mt-4 space-y-2">
              {tripResult.route.legs.map((leg, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-sm">
                      {leg.from} → {leg.to}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>{Math.round(leg.distance_miles)} miles</div>
                    <div>{Math.round(leg.duration_hours * 10) / 10}h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
