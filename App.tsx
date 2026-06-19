import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { setupNotifications } from './src/utils/notifications';

// Expo Go SDK 53+ removió push tokens remotos; solo usamos notificaciones locales
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

import HomeScreen from './src/screens/HomeScreen';
import CitasScreen from './src/screens/CitasScreen';
import DiarioScreen from './src/screens/DiarioScreen';
import DesarrolloScreen from './src/screens/DesarrolloScreen';
import PatadosScreen from './src/screens/PatadosScreen';
import SintomasScreen from './src/screens/SintomasScreen';
import ChecklistScreen from './src/screens/ChecklistScreen';
import ContraccionesScreen from './src/screens/ContraccionesScreen';
import NombresScreen from './src/screens/NombresScreen';
import FotosScreen from './src/screens/FotosScreen';
import EmergenciaScreen from './src/screens/EmergenciaScreen';
import PesoScreen from './src/screens/PesoScreen';
import BackupScreen from './src/screens/BackupScreen';
import DocumentosScreen from './src/screens/DocumentosScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
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
      <Tab.Screen
        name="Diario"
        component={DiarioScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📖</Text> }}
      />
      <Tab.Screen
        name="Desarrollo"
        component={DesarrolloScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👶</Text> }}
      />
    </Tab.Navigator>
  );
}

const STACK_HEADER = {
  headerShown: true,
  title: '',
  headerStyle: { backgroundColor: '#FFF5F7' },
  headerTintColor: '#C2185B',
  headerShadowVisible: false,
};

export default function App() {
  useEffect(() => { setupNotifications(); }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Patadas"  component={PatadosScreen}  options={STACK_HEADER} />
          <Stack.Screen name="Síntomas" component={SintomasScreen} options={STACK_HEADER} />
          <Stack.Screen name="Checklist"     component={ChecklistScreen}     options={STACK_HEADER} />
          <Stack.Screen name="Contracciones" component={ContraccionesScreen} options={STACK_HEADER} />
          <Stack.Screen name="Nombres"       component={NombresScreen}       options={STACK_HEADER} />
          <Stack.Screen name="Fotos"         component={FotosScreen}         options={STACK_HEADER} />
          <Stack.Screen name="Emergencia"   component={EmergenciaScreen}   options={STACK_HEADER} />
          <Stack.Screen name="Peso"         component={PesoScreen}         options={STACK_HEADER} />
          <Stack.Screen name="Backup"       component={BackupScreen}       options={STACK_HEADER} />
          <Stack.Screen name="Documentos"   component={DocumentosScreen}   options={STACK_HEADER} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
