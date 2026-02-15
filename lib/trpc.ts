import { httpLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import * as SecureStore from 'expo-secure-store';
import superjson from 'superjson';

import type { AppRouter } from '@/backend/trpc/app-router';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  console.log('=== TRPC CLIENT CONFIGURATION ===');
  console.log('EXPO_PUBLIC_CUSTOM_API_URL:', process.env.EXPO_PUBLIC_CUSTOM_API_URL);
  console.log('EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
  
  const customUrl = process.env.EXPO_PUBLIC_CUSTOM_API_URL;
  
  if (customUrl) {
    console.log('Using CUSTOM_API_URL:', customUrl);
    return customUrl;
  }
  
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    throw new Error(
      'Rork did not set EXPO_PUBLIC_RORK_API_BASE_URL, please use support'
    );
  }

  console.log('Using RORK_API_BASE_URL:', url);
  console.log('Full tRPC URL will be:', `${url}/trpc`);
  return url;
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/trpc`,
      transformer: superjson,
      async headers() {
        const token = await SecureStore.getItemAsync('accessToken');
        console.log('tRPC request headers - Has token:', !!token);
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
      fetch(url, options) {
        console.log('=== TRPC FETCH ===');
        console.log('URL:', url);
        console.log('Method:', options?.method);
        return fetch(url, options).catch(error => {
          console.error('=== FETCH FAILED ===');
          console.error('URL:', url);
          console.error('Error:', error);
          console.error('Error message:', error.message);
          throw error;
        });
      },
    }),
  ],
});
