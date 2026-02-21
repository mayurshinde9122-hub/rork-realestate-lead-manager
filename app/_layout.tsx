import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { trpc, trpcClient } from '@/lib/trpc';
import { AuthProvider } from '@/contexts/AuthContext';
import { requestNotificationPermissions } from '@/lib/notifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    requestNotificationPermissions();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('[Notifications] Tapped:', data);
      if (data?.leadId && typeof data.leadId === 'string') {
        router.push(`/lead-detail?id=${data.leadId}`);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="leads" options={{ title: 'Leads' }} />
      <Stack.Screen name="lead-detail" options={{ title: 'Lead Details' }} />
      <Stack.Screen name="add-lead" options={{ title: 'Add Lead' }} />
      <Stack.Screen name="edit-lead" options={{ title: 'Edit Lead' }} />
      <Stack.Screen name="notifications" options={{ title: 'Follow-ups' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="filter" options={{ presentation: 'modal', title: 'Filters' }} />
      <Stack.Screen name="log-interaction" options={{ presentation: 'modal', title: 'Log Interaction' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
