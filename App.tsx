import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import CitasScreen from './src/screens/CitasScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#C2185B',
          tabBarInactiveTintColor: '#aaa',
          tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 60, paddingBottom: 8 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }}
        />
        <Tab.Screen
          name="Citas"
          component={CitasScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
