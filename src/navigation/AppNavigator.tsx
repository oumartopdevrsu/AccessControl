import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HistoryScreen } from '../screens/HistoryScreen';
import { NewVisitScreen } from '../screens/NewVisitScreen';

export type RootTabParamList = {
  NewVisit: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            color: '#111827',
            fontWeight: '800',
          },
          tabBarActiveTintColor: '#14532d',
          tabBarInactiveTintColor: '#6b7280',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
        }}>
        <Tab.Screen
          name="NewVisit"
          component={NewVisitScreen}
          options={{
            title: 'Access Control RSU',
            tabBarLabel: 'Enregistrement',
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Access Control RSU',
            tabBarLabel: 'Historique',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
