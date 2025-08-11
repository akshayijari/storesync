# StoreSync

A modern inventory and product management app built with React Native, Expo, and Firebase. Features barcode scanning, Firestore integration, category filtering, and a clean UI for both Android and iOS.

---

## Features
- Product and inventory management (CRUD)
- Barcode scanning for products and inventory
- Firestore backend (products, inventory, categories)
- Category filter and search
- Dynamic product attributes
- User authentication (Firebase Auth)
- Responsive, modern UI
- iOS and Android support

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Yarn](https://classic.yarnpkg.com/en/docs/install/) or npm
- [Firebase Project](https://console.firebase.google.com/)

---

## Getting Started

### 1. Clone the Repository
```sh
git clone https://github.com/<your-username>/storesync.git
cd storesync
```

### 2. Install Dependencies
```sh
yarn install
# or
npm install
```

### 3. Configure Firebase
- Copy your Firebase config to `app.json` or set in `expo-constants` extra fields.
- Add your `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) if building native.

### 4. Start the App
```sh
npx expo start
```
- Scan the QR code with Expo Go (iOS/Android) or run on an emulator.

---

## Project Structure
```
assets/                # App icons, images
src/
  components/          # Reusable UI components
  modules/             # Auth, inventory logic
  navigation/          # Navigation setup
  screens/             # App screens (Products, Inventory, Login, etc.)
  services/            # Firebase service wrappers
  store/               # Redux store
  utils/               # Constants, helpers
App.tsx                # App entry point
firebase.ts            # Firebase config
```

---

## Environment Variables
Set your Firebase config in `app.json` under `expo.extra` or directly in `firebase.ts`.

---

## How to Use
- **Login** with your Firebase Auth credentials.
- **Manage Products:** Add, edit, delete, search, filter, and scan barcodes.
- **Manage Inventory:** Add via barcode, edit quantities, view details.
- **Category Filtering:** Filter products by category.
- **Barcode Scanning:** Use device camera to scan product barcodes.

---

## Deployment
- For production builds, use `expo build` or EAS Build.
- Set up Firebase rules for security.

---

## Troubleshooting
- If you see `Firebase App named '[DEFAULT]' already exists`, ensure only one initialization in `firebase.ts`.
- For iOS camera/modal issues, ensure all modals are closed before opening the scanner.

---

## Author
- [Akshay Ijari](https://github.com/akshayijari)
