// App.js

import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ActiveScreen from './src/screens/ActiveScreen';
import CustomSoundsScreen from './src/screens/CustomSoundsScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#0F0F0F', elevation: 0, shadowOpacity: 0 },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  cardStyle: { backgroundColor: '#0F0F0F' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'SPANK', headerShown: false }}
          />
          <Stack.Screen
            name="Active"
            component={ActiveScreen}
            options={{ title: 'Active Session', headerLeft: () => null }}
          />
          <Stack.Screen
            name="CustomSounds"
            component={CustomSoundsScreen}
            options={{ title: 'Custom Sounds' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
