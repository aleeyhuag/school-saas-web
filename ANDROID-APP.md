# Android app via Capacitor

This is a real, working setup — `@capacitor/core`, `@capacitor/android`, and `@capacitor/splash-screen` are installed, `npx cap add android` has already been run, and the `android/` folder is a genuine native Android project wrapping your existing React app. I verified it builds (`npm run build` succeeds, `npx cap sync android` succeeds) — the only thing I can't do from here is compile the actual `.apk`/`.aab`, since that needs Android Studio/the Android SDK, which only exists on your machine.

## Why this approach instead of a rewrite

Capacitor wraps your *existing* React/Tailwind code in a native shell — you're not rewriting anything in React Native. Every page, every API call, every bit of your Stage 41 work just runs inside a native WebView with a home-screen icon and Play Store listing. This is the standard path for exactly your situation.

## First-time setup on your machine

You'll need **Android Studio** installed (free, from developer.android.com) — it brings the Android SDK with it.

1. `git pull` this, then `npm install` in `school-saas-web/` (this installs the Capacitor packages that are already in `package.json`).
2. `npm run android:sync` — builds the React app and copies it into the native project.
3. `npm run android:open` — opens the `android/` folder in Android Studio.
4. In Android Studio: let Gradle finish syncing (first time takes a few minutes), then **Run ▶** with an emulator or your phone plugged in via USB debugging. This gives you a real, working app on a real device today.

## One decision to make before you go further: appId

`capacitor.config.ts` currently has a placeholder: `appId: 'ng.komputech.schoolsaas'`. This is your app's permanent package identifier — **it cannot be changed after your first Play Store submission** without publishing as an entirely new app listing (losing reviews, install counts, everything). Lock in the product name first, then set this properly, e.g. `ng.komputech.eduventor` or whatever you land on — before you ever submit to the Play Store. Changing it now (pre-submission) is trivial: edit the `appId` line, then `npx cap sync android` again.

## Every time you change the web app

```bash
npm run android:sync
```

This rebuilds the React app and pushes it into the native shell. Do this before every test run or before rebuilding the release APK.

## Getting it onto the Play Store (when you're ready)

1. **$25 one-time** Google Play Developer account fee (not annual).
2. In Android Studio: **Build → Generate Signed Bundle/APK** → choose Android App Bundle (`.aab`, what Play Store wants, not a raw `.apk`) → create a signing key the first time (Android Studio walks you through it) — **back this keystore file up somewhere safe**, if you lose it you can never update the app again under the same listing.
3. Upload the `.aab` to the Play Console, fill in the store listing (screenshots, description, privacy policy URL — you'll want the Privacy Policy page live on your website before this step, Google requires it).
4. Play Store review is typically a few days for a first submission.

## What you get for free vs. what needs more work later

Works out of the box with zero extra code: the whole app, offline-tolerant loading (it's just a WebView pointed at your bundled files), the home-screen icon, splash screen (already configured with your brand green, `#1F5C4A`).

Needs a small native plugin later if you want it: push notifications (there's a `@capacitor/push-notifications` plugin, straightforward to add when you're ready — ties into the notification infrastructure you already built in Stage 33), and a native camera picker for payment-proof uploads (currently uses the web file input, which works fine on Android already via the system file/camera picker, so this isn't urgent).

## iOS

Same Capacitor project supports iOS too (`npx cap add ios`) — I didn't run that here since it requires a Mac with Xcode to build regardless (can't be done on Windows or in this sandbox). When you're ready: same `npm run` pattern, but you'll need a Mac (or a cloud Mac service like MacStadium/Codemagic) plus a $99/year Apple Developer account.
