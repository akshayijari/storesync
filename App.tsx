// App.tsx (snippet)
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux'; // Renamed for clarity
import store from './src/store/store'; // Your new store
import { AuthProvider } from './src/modules/auth/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FlatList, View, Text } from 'react-native';

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <AuthProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </AuthProvider>
    </ReduxProvider>
  );
};

export default App;
