import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { CustomThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { DataProvider } from './src/contexts/DataContext';
import LoginScreen from './src/screens/LoginScreen';
import Header from './src/components/Header';
import MainNavigator from './src/navigation/MainNavigator';

// Main app component that uses all contexts
const MainApp = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (user) {
    return (
      <>
        <Header 
          onProfilePress={() => console.log('Profile pressed')}
          onLogout={handleLogout}
        />
        <MainNavigator />
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <LoginScreen />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
};

// Root app component with all providers
export default function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainApp />
        </DataProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}