import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="restaurant/[id]" 
            options={{ 
              headerShown: true,
              headerTitle: 'Restaurant',
              headerBackTitle: 'Back'
            }} 
          />
          <Stack.Screen 
            name="cart" 
            options={{ 
              headerShown: true,
              headerTitle: 'Your Cart',
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="checkout" 
            options={{ 
              headerShown: true,
              headerTitle: 'Checkout'
            }} 
          />
          <Stack.Screen 
            name="reservation" 
            options={{ 
              headerShown: true,
              headerTitle: 'Reserve Table'
            }} 
          />
          <Stack.Screen 
            name="order-confirmation" 
            options={{ 
              headerShown: true,
              headerTitle: 'Order Confirmed',
              headerBackVisible: false
            }} 
          />
          <Stack.Screen 
            name="reservation-confirmation" 
            options={{ 
              headerShown: true,
              headerTitle: 'Reservation Confirmed',
              headerBackVisible: false
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}
