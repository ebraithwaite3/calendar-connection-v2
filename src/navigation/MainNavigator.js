// src/navigation/MainNavigator.js
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Main screens
import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import GroupScreen from '../screens/GroupScreen';
import LoadingScreen from '../components/LoadingScreen';
import AddScreen from '../screens/AddScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ImportCalendarScreen from '../screens/ImportCalendarScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import JoinGroupScreen from '../screens/JoinGroupScreen';
import MessagesScreen from '../screens/MessagesScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import DayScreen from '../screens/DayScreen';

// Sub-screens
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';

import Header from '../components/Header';

const Tab = createBottomTabNavigator();
const TodayStack = createStackNavigator();
const CalendarStack = createStackNavigator();
const GroupsStack = createStackNavigator();
const PreferencesStack = createStackNavigator();

// Stack navigators for each tab
function TodayStackScreen() {
  return (
    <TodayStack.Navigator screenOptions={{ headerShown: false }}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} />
      <TodayStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <TodayStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <TodayStack.Screen name="AddScreen" component={AddScreen} />
      <TodayStack.Screen name="Messages" component={MessagesScreen} />
      <TodayStack.Screen name="CreateTask" component={CreateTaskScreen} />
    </TodayStack.Navigator>
  );
}

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <CalendarStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <CalendarStack.Screen name="AddScreen" component={AddScreen} />
      <CalendarStack.Screen name="ImportCalendar" component={ImportCalendarScreen} />
      <CalendarStack.Screen name="Messages" component={MessagesScreen} />
      <CalendarStack.Screen name="CreateTask" component={CreateTaskScreen} />
      <CalendarStack.Screen name="DayScreen" component={DayScreen} />
    </CalendarStack.Navigator>
  );
}

function GroupsStackScreen() {
  return (
    <GroupsStack.Navigator screenOptions={{ headerShown: false }}>
      <GroupsStack.Screen name="GroupsHome" component={GroupScreen} />
      <GroupsStack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      <GroupsStack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <GroupsStack.Screen name="JoinGroup" component={JoinGroupScreen} />
      <GroupsStack.Screen name="Messages" component={MessagesScreen} />
    </GroupsStack.Navigator>
  );
}

function PreferencesStackScreen() {
  return (
    <PreferencesStack.Navigator screenOptions={{ headerShown: false }}>
      <PreferencesStack.Screen name="PreferencesHome" component={PreferencesScreen} />
      <PreferencesStack.Screen name="Messages" component={MessagesScreen} />
    </PreferencesStack.Navigator>
  );
}

function TabNavigator({ initialRoute, theme, onLogout }) {
  const getTabBarIcon = (routeName, focused) => {
    let icon;
    
    switch (routeName) {
      case 'Today':
        icon = focused ? '📅' : '📋';
        break;
      case 'Calendar':
        icon = focused ? '🗓️' : '📆';
        break;
      case 'Groups':
        icon = focused ? '👥' : '👤';
        break;
      case 'Preferences':
        icon = focused ? '⚙️' : '🔧';
        break;
      default:
        icon = '❓';
    }
    
    return <Text style={{ fontSize: 20 }}>{icon}</Text>;
  };

  return (
    <>
      <Header 
        onProfilePress={() => console.log('Profile pressed')}
        onLogout={onLogout}
      />
      <Tab.Navigator
        initialRouteName={initialRoute}
        screenOptions={({ route }) => ({
          headerShown: false, // We'll use our custom header
          tabBarIcon: ({ focused }) => getTabBarIcon(route.name, focused),
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.text?.secondary || '#999',
          tabBarStyle: {
            backgroundColor: theme.card || theme.surface || '#fff',
            borderTopColor: theme.border || '#e0e0e0',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
        })}
      >
        <Tab.Screen
  name="Today"
  component={TodayStackScreen}
  options={{ tabBarLabel: 'Today' }}
  listeners={({ navigation }) => ({
    tabPress: () => {
      console.log("Navigating to TodayHome");
      navigation.navigate('Today', { screen: 'TodayHome' });
    },
  })}
/>

        <Tab.Screen 
          name="Calendar" 
          component={CalendarStackScreen}
          options={{
            tabBarLabel: 'Calendars',
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              console.log("Navigating to CalendarHome");
              navigation.navigate('Calendar', { screen: 'CalendarHome' });
            },
          })}
        />
        <Tab.Screen 
          name="Groups" 
          component={GroupsStackScreen}
          options={{
            tabBarLabel: 'Groups',
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Groups', { screen: 'GroupsHome' });
            },
          })}
        />
        <Tab.Screen
          name="Preferences"
          component={PreferencesStackScreen}
          options={{
            tabBarLabel: 'Preferences',
          }}
          listeners={({ navigation }) => ({
            tabPress: () => {
              navigation.navigate('Preferences', { screen: 'PreferencesHome' });
            },
          })}
        />
      </Tab.Navigator>
    </>
  );
}

const MainNavigator = ({ onLogout }) => {
  const { theme, isDarkMode } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const { loading, user } = useData();

  // Get the default page from the user doc
  // in preferences.defaultLoadingPage
  useEffect(() => {
    const fetchInitialRoute = async () => {
      try {
        if (user && user.preferences && user.preferences.defaultLoadingPage) {
          setInitialRoute(user.preferences.defaultLoadingPage);
        } else {
          // Fallback to AsyncStorage if user data isn't available yet
          const storedRoute = await AsyncStorage.getItem('defaultLoadingPage');
          setInitialRoute(storedRoute || 'Today');
        }
      } catch (error) {
        console.error('Error fetching initial route:', error);
        setInitialRoute('Today'); // Fallback to Today on error
      } finally {
        setIsReady(true);
      }
    };

    fetchInitialRoute();
  }, [user]);

  if (loading || !isReady) {
    return <LoadingScreen />;
  }

  const linking = {
    prefixes: ['calendarconnectionv2://'],
    config: {
      screens: {
        Today: {
          screens: {
            TodayHome: 'today',
            EventDetails: 'today/event/:eventId',
            CreateEvent: 'today/create',
            Messages: 'today/messages',
            CreateTask: 'today/create-task',
          },
        },
        Calendar: {
          screens: {
            CalendarHome: 'calendar',
            EventDetails: 'calendar/event/:eventId',
            CreateEvent: 'calendar/create',
            ImportCalendar: 'calendar/import',
            Messages: 'calendar/messages',
            CreateTask: 'calendar/create-task',
          },
        },
        Groups: {
          screens: {
            GroupsHome: 'groups',
            GroupDetails: 'groups/:groupId',
            CreateGroup: 'groups/create',
            JoinGroup: 'groups/join',
            Messages: 'groups/messages',
          },
        },
        Preferences: {
          screens: {
            PreferencesHome: 'preferences',
            Messages: 'preferences/messages',
          },
        },
        NotFound: '*',
      },
    },
  };

  return (
    <NavigationContainer 
      linking={linking}
    >
      <TabNavigator initialRoute={initialRoute} theme={theme} onLogout={onLogout} />
    </NavigationContainer>
  );
};

export default MainNavigator;