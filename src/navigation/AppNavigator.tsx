import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../modules/auth/AuthContext'; // Path from src/navigation
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AdminDashboard from '../screens/AdminDashboard';
import BottomTabs from './BottomTabs';
import DrawerNavigator from './DrawerNavigator';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { user } = useAuth(); // Now safe inside AuthProvider

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
