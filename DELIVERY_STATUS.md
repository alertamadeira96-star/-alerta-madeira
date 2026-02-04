 # Alerta Madeira – Project Status & Delivery

## 1. Project overview

This document summarizes the current state of the **Alerta Madeira** mobile app and what is included in this delivery.

The project is a React Native / Expo application with:
- User authentication
- Occurrence reporting and listing
- Op. Stop (operations) section
- Anomalies section
- Lost & found (perdidos) section
- Push notifications (Supabase + Expo)
- Admin panel
- User profile and settings

## 2. What is implemented

The following features are implemented in the codebase:

- **Authentication & user accounts**
  - Email/password login
  - Registration and password reset
  - Authenticated session handling and redirects

- **Occurrences / incidents**
  - Create new occurrence with description, category, location and media
  - List and view occurrences
  - Basic interactions (likes / reactions / comments UI where applicable)

- **Op. Stop**
  - Screens and flows for operations/controls
  - Listing and details screens

- **Anomalies**
  - Create and manage anomalies
  - Listing and detail views

- **Lost & found (perdidos)**
  - Create lost pet/post entries
  - Listing and details

- **Notifications**
  - Expo Notifications integration
  - Supabase integration for storing and triggering notifications

- **Admin area**
  - Admin-only screens
  - Management of content (posts/alerts/media where applicable)

- **Profile**
  - User profile screen and related settings

Backend and configuration:
- **Supabase** project configured and integrated
- Environment/config wiring for Supabase and Expo

## 3. Technical stack

- **Frontend:** React Native with Expo & Expo Router
- **State / data:** React Query, Zustand where relevant
- **Backend:** Supabase (database + auth + notifications integration)
- **Build:** EAS (Expo Application Services) for Android APK

## 4. Current build status (Android)

- The codebase is in a **functionally complete** state for the features listed above.
- We are finalizing a **stable Android APK** build:
  - We have resolved several build and configuration issues (Metro bundler, Expo router, New Architecture vs. Old Architecture).
  - A fresh APK build is being generated and will be delivered as soon as it is confirmed stable on device.

**Important:** This delivery contains:
- Full project source code
- Documentation and build notes

The **APK file** will follow shortly as a separate deliverable once the latest build is confirmed.

## 5. What is included in this delivery

In this delivery you receive:

- **Source code:** Complete project folder / repository.
- **Configuration & build notes:** Instructions and notes on how to install dependencies and build the Android app using EAS.
- **Status documentation:** This document, describing what is implemented and current build status.

## 6. Next steps

- Finalize and validate the latest Android APK build.
- Send the APK download link (or file) for installation and testing on real devices.
- After your testing, collect feedback (UI tweaks, text changes, minor adjustments) and schedule a short follow-up iteration to apply them.

