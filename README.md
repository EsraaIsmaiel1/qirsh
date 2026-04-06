# Pay Wallet

Pay Wallet is a cross-platform mobile app (iOS, Android, and web) for managing a digital wallet: balances, transactions, analytics, sending and receiving money, and expenses. It is built with [Expo](https://expo.dev) and [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation.

## Features

- **Authentication** — Sign-in and registration flows with session handling (`(auth)` routes).
- **Home & tabs** — Home, transactions list, analytics, and settings (`(app)/(tabs)`).
- **Money flows** — Dedicated screens for send, receive, and add-expense (`(app)` stack).
- **Transaction detail** — Dynamic route for a single transaction (`transaction-detail/[id]`).
- **Theming** — Light/dark-aware UI with a shared wallet theme and navigation styling.
- **Haptics & polish** — Tab haptics, splash screen integration, and secure storage where appropriate.

## Tech stack

| Area | Libraries |
|------|-----------|
| Framework | React 19, React Native, Expo SDK 54 |
| Routing | Expo Router 6 (typed routes enabled) |
| State | Zustand, TanStack React Query |
| Forms & validation | React Hook Form, Zod, `@hookform/resolvers` |
| HTTP | Axios |
| Native APIs | Secure Store, Local Authentication, Notifications, Clipboard, Print/Sharing, QR (`react-native-qrcode-svg`) |
| UI motion | Reanimated, Gesture Handler |

The app entry re-exports navigation and screens from `src/` while routes live under `app/` (Expo Router convention).

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (or another compatible package manager)
- For device testing: [Expo Go](https://expo.dev/go) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm start
   ```

   Or run platform targets directly:

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

3. Open the project in Expo Go or your emulator/simulator using the prompts in the terminal.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo (`expo start`) |
| `npm run android` | Start with Android |
| `npm run ios` | Start with iOS |
| `npm run web` | Start for web |
| `npm run lint` | Run ESLint (Expo config) |
| `npm run reset-project` | Move starter layout to `app-example` and scaffold a blank `app` (Expo template helper) |

## Project layout

```
app/                    # Route files (Expo Router)
  (auth)/               # Login, register, auth landing
  (app)/                # Signed-in area
    (tabs)/             # Tab screens: home, transactions, analytics, settings
    send.tsx, receive.tsx, add-expense.tsx, ...
src/                    # Screens, components, stores, services, hooks
assets/                 # Images and static assets
```

Deep link / app scheme: **`paywallet`** (see `app.json`).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
