# PnL Diary - Trading Journal Application

A comprehensive mobile trading journal application built with React Native and Expo that helps traders track, analyze, and improve their trading performance.

## Features

### Authentication & Security
- Firebase-based authentication with email/password
- Email verification requirement
- Secure password reset functionality
- Firebase secure rules implementation

### Trade Entry & Management
- Create detailed trade entries with asset, entry/exit prices, quantities
- Edit and update trade details
- Close trades with profit/loss calculations
- Tag trades with strategies and indicators
- Add notes and identify mistakes for learning

### Analytics & Performance Tracking
- View comprehensive performance metrics:
  - Win rate percentage
  - Total profit/loss
  - Average trade profit/loss
  - Best and worst trades
  - Profit factor

### Journal & Notes
- Add detailed notes to each trade
- Track reasons for entry and exit
- Document trade strategy and indicators used
- Identify mistakes for continuous improvement

### Offline Capability
- Cache trades for offline viewing
- Queue operations for sync when back online

## Getting Started

### Prerequisites
- Node.js 16 or higher
- Expo CLI (`npm install -g expo-cli`)
- Firebase account (for authentication and database)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/rvnparado/PnL-Diary.git
   cd PnL-Diary
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up Firebase
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Add your Firebase configuration to .env file

4. Create a .env file in the project root with your Firebase configuration
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. Start the development server
   ```bash
   npm start
   ```

## Build for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

## Tech Stack

- **Frontend**: React Native, Expo, Expo Router
- **State Management**: React Context API
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Styling**: StyleSheet (React Native)
- **Charts**: react-native-chart-kit

## Project Structure

- `app/` - Main application code
  - `(auth)/` - Authentication routes
  - `(tabs)/` - Tab navigator routes
  - `screens/` - Screen components
  - `components/` - Reusable UI components
  - `lib/` - Utilities and services
  - `config/` - Configuration files
  - `contexts/` - React context providers

## Roadmap

- [ ] CSV/PDF export functionality
- [ ] Add more advanced chart types
- [ ] Social sharing of trade results
- [ ] Trade image attachment capability
- [ ] Performance analytics improvements
- [ ] Push notifications for trade reminders

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- React Native community
- Expo team
- Firebase team
