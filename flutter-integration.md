# Flutter Integration Guide

## API Client Setup

### 1. Add Dependencies

Add to `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.2
  firebase_messaging: ^14.7.9
  firebase_core: ^2.24.2
```

### 2. API Service

Create `lib/services/api_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences';

class ApiService {
  static const String baseUrl = 'https://your-domain.com/api';
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
  
  static Future<Map<String, String>> getHeaders() async {
    final token = await getToken();
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
  
  // Auth
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth?action=login'),
      headers: await getHeaders(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    return jsonDecode(response.body);
  }
  
  static Future<Map<String, dynamic>> register(String email, String password, String name) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth?action=register'),
      headers: await getHeaders(),
      body: jsonEncode({'email': email, 'password': password, 'name': name}),
    );
    return jsonDecode(response.body);
  }
  
  // Posts
  static Future<List<dynamic>> getPosts() async {
    final response = await http.get(
      Uri.parse('$baseUrl/posts'),
      headers: await getHeaders(),
    );
    final result = jsonDecode(response.body);
    return result['data'] ?? [];
  }
  
  static Future<Map<String, dynamic>> createPost(Map<String, dynamic> post) async {
    final response = await http.post(
      Uri.parse('$baseUrl/posts'),
      headers: await getHeaders(),
      body: jsonEncode(post),
    );
    return jsonDecode(response.body);
  }
  
  static Future<void> deletePost(String postId) async {
    await http.delete(
      Uri.parse('$baseUrl/posts?id=$postId'),
      headers: await getHeaders(),
    );
  }
  
  // Push Tokens
  static Future<void> registerPushToken(String token, String platform) async {
    await http.post(
      Uri.parse('$baseUrl/push-tokens'),
      headers: await getHeaders(),
      body: jsonEncode({'token': token, 'platform': platform}),
    );
  }
}
```

### 3. Firebase Cloud Messaging Setup

Create `lib/services/push_notification_service.dart`:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'api_service.dart';

class PushNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  static Future<void> initialize() async {
    await Firebase.initializeApp();
    
    // Request permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // Get FCM token
      String? token = await _messaging.getToken();
      if (token != null) {
        // Register with backend
        await ApiService.registerPushToken(token, 'android'); // or 'ios'
      }
      
      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        ApiService.registerPushToken(newToken, 'android');
      });
    }
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      print('Message data: ${message.data}');
      if (message.notification != null) {
        print('Message notification: ${message.notification?.title}');
      }
    });
    
    // Handle background messages (must be top-level function)
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}
```

### 4. Initialize in main.dart

```dart
import 'package:flutter/material.dart';
import 'services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushNotificationService.initialize();
  runApp(MyApp());
}
```

## Firebase Setup

1. Create Firebase project at https://console.firebase.google.com
2. Add Android/iOS apps
3. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
4. Place in appropriate directories
5. Get Server Key from Firebase Console → Project Settings → Cloud Messaging
6. Add to PHP backend: `backend-php/services/fcm.php` → `FCM_SERVER_KEY`

