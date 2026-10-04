import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AppProvider } from '@/state/AppState';
import { SessionProvider } from '@/state/SessionState';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <SessionProvider>
            <AppProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#FFFFFF' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="results" />
                <Stack.Screen name="listing/[slug]" />
                <Stack.Screen name="mortgage" />
                <Stack.Screen name="chat" />
                <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
              </Stack>
            </AppProvider>
          </SessionProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
