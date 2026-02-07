import '@/lib/suppressAuthAbortError'; // Must run first – catches "signal is aborted" before overlay
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { Component, useEffect, useRef } from "react";
import { View, Text, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PostsProvider } from "@/contexts/PostsContext";
import { AdminProvider } from "@/contexts/AdminContext";
import Colors from "@/constants/colors";
import { registerForPushNotifications, addNotificationReceivedListener, addNotificationResponseReceivedListener } from "@/services/pushNotifications";
import * as Notifications from 'expo-notifications';
import '@/services/supabase'; // Initialize Supabase

// Swallow "signal is aborted" so it doesn't show in the dev overlay
class AbortErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    const msg = error?.message ?? '';
    if (msg.toLowerCase().includes('abort') || msg.includes('signal')) return null;
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const msg = error?.message ?? '';
    if (msg.toLowerCase().includes('abort') || msg.includes('signal')) return;
    console.error(error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const msg = this.state.error?.message ?? '';
      if (msg.toLowerCase().includes('abort') || msg.includes('signal')) {
        return this.props.children;
      }
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: Colors.text }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

try {
  SplashScreen.preventAutoHideAsync();
} catch (_) {
  // Ignore on Expo Go or when native module not ready
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { user } = useAuth();

  useEffect(() => {
    // Only register notification listeners on native (on web, removeSubscription can throw)
    if (user && Platform.OS !== 'web') {
      registerForPushNotifications().catch(() => {});

      notificationListener.current = addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
      });
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (_) {
        // On web, removeNotificationSubscription can throw "emitter.removeSubscription is not a function"
      }
      notificationListener.current = undefined;
      responseListener.current = undefined;
    };
  }, [user]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Voltar" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen 
        name="post/create" 
        options={{ 
          presentation: "modal",
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="post/[id]" 
        options={{ 
          title: "Detalhes",
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textInverse,
        }} 
      />
      <Stack.Screen name="+not-found" />
      <Stack.Screen 
        name="admin/index" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Delay hide so native shell is ready (prevents crash on built app)
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AbortErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PostsProvider>
            <AdminProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <StatusBar style="light" />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </AdminProvider>
          </PostsProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AbortErrorBoundary>
  );
}
