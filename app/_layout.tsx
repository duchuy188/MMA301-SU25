import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { loadAuthTokens } from '../services/auth';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
    'Montserrat-Bold': Montserrat_700Bold,
  });

  useEffect(() => {
    async function loadAuth() {
      await loadAuthTokens();
      setIsAuthLoaded(true);
    }
    
    loadAuth();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isAuthLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthLoaded]);

  if (!fontsLoaded && !fontError || !isAuthLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="movie-detail" />
        <Stack.Screen name="cinema-selection" />
        <Stack.Screen name="datetime-selection" />
        <Stack.Screen name="seat-selection" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="e-ticket" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
      <Toast />
    </>
  );
}