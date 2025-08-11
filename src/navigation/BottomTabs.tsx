import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import InventoryScreen from '../screens/InventoryScreen';
import AdminDashboard from '../screens/AdminDashboard';
import GenerateInvoiceScreen from '../screens/GenerateInvoiceScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import { useAuth } from '../modules/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();


import { View, TouchableOpacity, Text, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[headerStyles.header, { paddingTop: insets.top }]}> 
      <TouchableOpacity
        onPress={() => navigation.canGoBack() ? navigation.goBack() : null}
        style={headerStyles.leftBtn}
      >
        <Text style={headerStyles.leftBtnText}>{Platform.OS === 'ios' ? '‹' : '<'}</Text>
      </TouchableOpacity>
      <Image source={require('../../assets/logo.png')} style={headerStyles.logo} resizeMode="contain" />
      <TouchableOpacity
        onPress={() => navigation.openDrawer()}
        style={headerStyles.rightBtn}
      >
        <Text style={headerStyles.rightBtnText}>☰</Text>
      </TouchableOpacity>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    backgroundColor: '#c7d9fcff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
  },
  leftBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBtnText: {
    fontSize: 28,
    color: '#4f8cff',
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? 2 : 0,
  },
  logo: {
    width: 60,
    height: 60,
    flex: 1,
    alignSelf: 'center',
  },
  rightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBtnText: {
    fontSize: 24,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
});

const BottomTabs: React.FC = () => {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'apps';
          if (route.name === 'Inventory') iconName = 'cube-outline';
          if (route.name === 'Scanner') iconName = 'barcode-outline';
          if (route.name === 'AdminDashboard') iconName = 'settings-outline';
          if (route.name === 'GenerateInvoice') iconName = 'receipt-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        header: ({ navigation }) => (
          <Header navigation={navigation} />
        ),
      })}
    >
      {user?.role === 'admin' && (
        <Tab.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: 'Admin' }} />
      )}
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          title: 'Invoices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
