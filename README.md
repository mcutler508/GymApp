# Gym Tracker

A mobile app for tracking exercises completed at the gym, built with Expo and React Native.

## Features

- **Exercise Repository**: Browse and search through a comprehensive list of exercises
- **Workout Logging**: Document exercises with weight and reps tracking
- **Statistics Dashboard**: View workout trends and personal records
- **User Authentication**: Secure user accounts with Supabase Auth
- **Cross-Platform**: Works on both iOS and Android

## Tech Stack

- **Frontend**: Expo (React Native + TypeScript)
- **Backend**: Supabase (Authentication + PostgreSQL Database)
- **UI Library**: React Native Paper
- **Navigation**: React Navigation
- **Charts**: React Native Chart Kit

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to the project directory:
```bash
cd C:\Users\mcutl\Documents\gym-tracker
```

2. Install dependencies (already done):
```bash
npm install
```

### Setting Up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Copy your project URL and anon key from Project Settings > API
4. Update `src/services/supabase.ts` with your credentials:
```typescript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

5. Create the following tables in your Supabase database:

**users table** (auto-created by Supabase Auth)

**exercises table**:
```sql
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  difficulty TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**workout_logs table**:
```sql
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  exercise_id UUID REFERENCES exercises(id) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**workout_sets table**:
```sql
CREATE TABLE workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  weight DECIMAL NOT NULL,
  reps INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Running the App

Start the development server:
```bash
npm start
```

Then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator (macOS only)
- Scan the QR code with Expo Go app on your phone

## Project Structure

```
gym-tracker/
├── src/
│   ├── components/        # Reusable UI components
│   ├── constants/         # Theme colors, spacing, etc.
│   ├── navigation/        # Navigation configuration
│   ├── screens/          # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── ExercisesScreen.tsx
│   │   ├── WorkoutLogScreen.tsx
│   │   └── StatisticsScreen.tsx
│   ├── services/         # API and Supabase services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── App.tsx              # Main app component
└── package.json
```

## Next Steps

### Immediate Tasks:
1. Set up Supabase account and configure credentials
2. Create database tables in Supabase
3. Test the app on your device using Expo Go

### Features to Implement:
1. **Authentication**:
   - Add login/signup screens
   - Implement Supabase Auth
   - Add user profile management

2. **Exercise Management**:
   - Connect to Supabase to fetch real exercises
   - Add ability to create custom exercises
   - Add exercise detail view with instructions

3. **Workout Logging**:
   - Create "Add Workout" screen
   - Implement form to log sets, reps, and weight
   - Save workout logs to Supabase
   - Add edit/delete functionality

4. **Statistics**:
   - Fetch real data from Supabase
   - Calculate personal records
   - Show progress over time
   - Add filters by date range and exercise

5. **Additional Features**:
   - Workout templates/programs
   - Rest timer between sets
   - Exercise history per exercise
   - Body measurements tracking
   - Progress photos
   - Export data functionality

## Development Commands

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web
npm run web

# Type checking
npx tsc --noEmit

# Format code
npx prettier --write .
```

## Contributing

This is a personal project, but feel free to fork and customize for your own use.

## License

MIT
