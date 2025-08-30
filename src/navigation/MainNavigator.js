// src/navigation/MainNavigator.js
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';

// Main screens
import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import GroupScreen from '../screens/GroupScreen';

// Sub-screens
import EventDetailsScreen from '../screens/EventDetailsScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';

const Tab = createBottomTabNavigator();
const TodayStack = createStackNavigator();
const CalendarStack = createStackNavigator();
const GroupsStack = createStackNavigator();

// Stack navigators for each tab
function TodayStackScreen() {
  return (
    <TodayStack.Navigator screenOptions={{ headerShown: false }}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} />
      <TodayStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <TodayStack.Screen name="CreateEvent" component={CreateEventScreen} />
    </TodayStack.Navigator>
  );
}

function CalendarStackScreen() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="EventDetails" component={EventDetailsScreen} />
      <CalendarStack.Screen name="CreateEvent" component={CreateEventScreen} />
    </CalendarStack.Navigator>
  );
}

function GroupsStackScreen() {
  return (
    <GroupsStack.Navigator screenOptions={{ headerShown: false }}>
      <GroupsStack.Screen name="GroupsHome" component={GroupScreen} />
      <GroupsStack.Screen name="GroupDetails" component={GroupDetailsScreen} />
    </GroupsStack.Navigator>
  );
}

const MainNavigator = () => {
  const { theme, isDarkMode } = useTheme();

  const linking = {
    prefixes: ['calendarconnectionv2://'],
    config: {
      screens: {
        Today: {
          screens: {
            TodayHome: 'today',
            EventDetails: 'today/event/:eventId',
            CreateEvent: 'today/create',
          },
        },
        Calendar: {
          screens: {
            CalendarHome: 'calendar',
            EventDetails: 'calendar/event/:eventId',
            CreateEvent: 'calendar/create',
          },
        },
        Groups: {
          screens: {
            GroupsHome: 'groups',
            GroupDetails: 'groups/:groupId',
          },
        },
      },
    },
  };

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
      default:
        icon = '❓';
    }
    
    return <Text style={{ fontSize: 20 }}>{icon}</Text>;
  };

  return (
    <NavigationContainer 
      linking={linking}
    >
      <Tab.Navigator
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
          options={{
            tabBarLabel: 'Today',
          }}
        />
        <Tab.Screen 
          name="Calendar" 
          component={CalendarStackScreen}
          options={{
            tabBarLabel: 'Calendar',
          }}
        />
        <Tab.Screen 
          name="Groups" 
          component={GroupsStackScreen}
          options={{
            tabBarLabel: 'Groups',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;