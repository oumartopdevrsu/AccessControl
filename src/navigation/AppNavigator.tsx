import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HistoryScreen} from '../screens/HistoryScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {NewVisitScreen} from '../screens/NewVisitScreen';

export type RootTabParamList = {
  Home: undefined;
  NewVisit: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({
  color,
  symbol,
}: {
  color: string;
  symbol: string;
}) {
  return <Text style={[styles.tabIcon, {color}]}>{symbol}</Text>;
}

function LogoutButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable style={styles.logoutButton} onPress={onPress}>
      <Text style={styles.logoutButtonText}>Deconnexion</Text>
    </Pressable>
  );
}

function HeaderRightButton(onLogout: () => void) {
  return function HeaderRight() {
    return <LogoutButton onPress={onLogout} />;
  };
}

function renderHomeIcon({color}: {color: string}) {
  return <TabIcon color={color} symbol="⌂" />;
}

function renderNewVisitIcon({color}: {color: string}) {
  return <TabIcon color={color} symbol="◎" />;
}

function renderHistoryIcon({color}: {color: string}) {
  return <TabIcon color={color} symbol="◷" />;
}

export function AppNavigator({onLogout}: {onLogout: () => void}) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#eff6ff',
          },
          headerTitleStyle: {
            color: '#0f172a',
            fontWeight: '800',
          },
          headerShadowVisible: false,
          tabBarStyle: {
            height: 64,
            paddingBottom: 6,
            paddingTop: 6,
            backgroundColor: '#eff6ff',
            borderTopColor: '#bfdbfe',
          },
          tabBarActiveTintColor: '#0f766e',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
          },
          headerRight: HeaderRightButton(onLogout),
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Access Control RSU',
            tabBarLabel: 'Accueil',
            tabBarIcon: renderHomeIcon,
          }}
        />
        <Tab.Screen
          name="NewVisit"
          component={NewVisitScreen}
          options={{
            title: 'Access Control RSU',
            tabBarLabel: 'Enregistrement',
            tabBarIcon: renderNewVisitIcon,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Access Control RSU',
            tabBarLabel: 'Historique',
            tabBarIcon: renderHistoryIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 18,
  },
  logoutButton: {
    marginRight: 14,
    minHeight: 32,
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '800',
  },
});
