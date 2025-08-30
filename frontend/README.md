# ELD Trip Planner - Complete Deployment Guide

## Project Overview

This is a Full-Stack Electronic Logging Device (ELD) Trip Planner that helps truck drivers comply with Federal Hours of Service (HOS) regulations. The application:

- **Plans optimal routes** with required rest stops
- **Generates compliant ELD logs** automatically 
- **Visualizes routes and stops** on an interactive interface
- **Checks HOS compliance** in real-time
- **Creates downloadable log sheets** for regulatory compliance

## Technology Stack

- **Backend**: Django + Django REST Framework
- **Frontend**: React with Tailwind CSS
- **Database**: SQLite (can be upgraded to PostgreSQL)
- **Deployment**: Vercel (Frontend) + Railway/Heroku (Backend)

## Project Structure

```
eld-trip-planner/
├── backend/                    # Django Backend
│   ├── eld_project/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── trip_planner/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── requirements.txt
│   ├── manage.py
│   └── .env
├── frontend/                   # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   └── ELDTripPlanner.jsx
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── README.md
└── .gitignore
```

## Quick Setup Instructions

### Prerequisites

- Python 3.8+ (for Django backend)
- Node.js 16+ (for React frontend)
- npm or yarn

### Backend Setup (Django)

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create virtual environment and install dependencies**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Run migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

4. **Create superuser (optional)**:
```bash
python manage.py createsuperuser
```

5. **Start Django server**:
```bash
python manage.py runserver
```

The Django backend will be available at `http://localhost:8000`

### Frontend Setup (React)

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start React development server**:
```bash
npm start
```

The React frontend will be available at `http://localhost:3000`

## API Endpoints

### Backend API (Django)

- `POST /api/plan-trip/` - Plan a new trip and generate ELD logs
- `GET /api/trip/<id>/` - Get trip details and logs

### Request Format for Trip Planning

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "New York, NY", 
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_hours": 45.5
}
```

### Response Format

```json
{
  "trip_id": 1,
  "route": {
    "legs": [...],
    "total_distance": 950,
    "total_driving_time": 15.8,
    "fuel_stops": 1,
    "required_rest_stops": [...],
    "all_coordinates": [...]
  },
  "eld_logs": [...],
  "compliance_summary": {
    "total_driving_hours": 15.8,
    "total_on_duty_hours": 21.8,
    "projected_cycle_hours": 67.3,
    "violations": [],
    "warnings": [],
    "compliant": true
  }
}
```

## Features

### Trip Planning
- Input current location, pickup, and dropoff locations
- Specify current cycle hours used
- Automatic route calculation with distance and time estimates
- Required rest stop identification based on HOS regulations

### HOS Compliance
- Real-time compliance checking
- 11-hour daily driving limit enforcement
- 14-hour daily window monitoring
- 70-hour 8-day cycle tracking
- Automatic violation and warning detection

### ELD Log Generation
- 24-hour grid visualization
- 15-minute time slot tracking
- Four duty status categories:
  - Off Duty (green)
  - Sleeper Berth (blue)
  - Driving (red)
  - On Duty Not Driving (yellow)
- Detailed remarks and activity tracking
- Multi-day log support for longer trips

### Route Visualization
- Interactive map placeholder
- Route leg breakdown
- Distance and time calculations
- Required fuel and rest stops
- Coordinate tracking

## HOS Regulations Implemented

- **11-Hour Driving Limit**: Maximum 11 hours of driving per day
- **14-Hour Window**: Maximum 14 hours on-duty per day
- **30-Minute Break**: Required after 8 hours of driving
- **10-Hour Rest**: Required 10 consecutive hours off-duty
- **70-Hour Cycle**: Maximum 70 hours on-duty in 8 consecutive days

## Deployment

### Backend Deployment (Railway/Heroku)

1. **Create a new project on Railway or Heroku**
2. **Connect your GitHub repository**
3. **Set environment variables**:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `ALLOWED_HOSTS`
4. **Deploy the backend directory**

### Frontend Deployment (Vercel)

1. **Create a new project on Vercel**
2. **Connect your GitHub repository**
3. **Set build settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **Set environment variables**:
   - `REACT_APP_API_URL` (your backend URL)
5. **Deploy the frontend directory**

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
```



## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
