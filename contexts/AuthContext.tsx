import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import createContextHook from '@nkzw/create-context-hook';
import { trpc } from '@/lib/trpc';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation();
  const refreshMutation = trpc.auth.refresh.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const loadTokens = useCallback(async () => {
    try {
      console.log('Loading tokens from secure store...');
      const token = await SecureStore.getItemAsync('accessToken');
      const refresh = await SecureStore.getItemAsync('refreshToken');
      
      if (token && refresh) {
        console.log('Tokens found, attempting to validate...');
        setAccessToken(token);
        
        try {
          const result = await refreshMutation.mutateAsync({ refreshToken: refresh });
          await SecureStore.setItemAsync('accessToken', result.accessToken);
          setAccessToken(result.accessToken);
          setUser(result.user);
          console.log('User loaded:', result.user.email);
        } catch {
          console.log('Token refresh failed, clearing tokens');
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
          setUser(null);
          setAccessToken(null);
        }
      } else {
        console.log('No tokens found, user needs to log in');
        setUser(null);
        setAccessToken(null);
      }
    } catch (error) {
      console.log('Error loading tokens:', error);
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshMutation.mutateAsync]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const login = async (email: string, password: string) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Email:', email);
      
      const result = await loginMutation.mutateAsync({ email, password });
      
      console.log('Login API call successful, storing tokens...');
      await SecureStore.setItemAsync('accessToken', result.accessToken);
      await SecureStore.setItemAsync('refreshToken', result.refreshToken);
      
      setAccessToken(result.accessToken);
      setUser(result.user);
      
      console.log('=== LOGIN SUCCESSFUL ===');
      console.log('User:', result.user.name);
    } catch (error: any) {
      console.error('=== LOGIN FAILED ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      const errorMessage = error?.message || 'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        await logoutMutation.mutateAsync({ refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      setUser(null);
      setAccessToken(null);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    accessToken,
  };
});
