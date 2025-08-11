import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import BottomTabs from './BottomTabs';
import { useAuth } from '../modules/auth/AuthContext';
import { View, Text, StyleSheet } from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';
import GenerateInvoiceScreen from '../screens/GenerateInvoiceScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProductsScreen from '../screens/ProductsScreen';
import AdminDashboard from '../screens/AdminDashboard';
import ScannerScreen from '../screens/ScannerScreen';

const Stack = createStackNavigator();

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={BottomTabs} />
    <Stack.Screen name="GenerateInvoice" component={GenerateInvoiceScreen} />
    <Stack.Screen name="Scanner" component={ScannerScreen} />
    {/* Add other modals/screens here if needed */}
  </Stack.Navigator>
);

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const { logout } = useAuth();
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Products"
        onPress={() => props.navigation.navigate('Products')}
        labelStyle={styles.logoutLabel}
      />
      <DrawerItem
        label="Logout"
        onPress={logout}
        labelStyle={styles.logoutLabel}
      />
    </DrawerContentScrollView>
  );
};

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerPosition: 'right' }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainStack" component={MainStack} />
      <Drawer.Screen name="Products" component={ProductsScreen} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutLabel: {
    color: '#ff4f4f',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DrawerNavigator;
