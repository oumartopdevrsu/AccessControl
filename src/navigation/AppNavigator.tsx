/**
 * Navigation principale de l'application.
 *
 * Structure :
 *  - Bottom Tab Navigator avec 3 onglets : Accueil, Enregistrement, Historique.
 *  - En-tête bleu RSU avec logo à gauche et bouton de déconnexion à droite.
 *  - Icônes d'onglets avec fond actif arrondi.
 */

import React from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HistoryScreen} from '../screens/HistoryScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {NewVisitScreen} from '../screens/NewVisitScreen';
import {Colors, FontSize, Radius, Shadows, Spacing} from '../theme';

/** Paramètres de chaque onglet (aucun paramètre passé aux écrans) */
export type RootTabParamList = {
  Home:     undefined;
  NewVisit: undefined;
  History:  undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// ─── Composants utilitaires ───────────────────────────────────────────────────

/**
 * Icône d'onglet : fond circulaire teinté quand l'onglet est actif.
 */
function TabIcon({
  symbol,
  color,
  focused,
}: {
  symbol: string;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={[styles.tabIconSymbol, {color}]}>{symbol}</Text>
    </View>
  );
}

/** Petit logo RSU dans l'en-tête (côté gauche) */
function HeaderLogo() {
  return (
    <Image
      source={require('../assets/images/rsu-logo.png')}
      style={styles.headerLogo}
      resizeMode="contain"
    />
  );
}

/** Bouton de déconnexion dans l'en-tête (côté droit) */
function LogoutButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable style={styles.logoutBtn} onPress={onPress}>
      <Text style={styles.logoutBtnText}>Déconnexion</Text>
    </Pressable>
  );
}

// Factories stables pour éviter de recréer les composants d'en-tête à chaque rendu
function makeHeaderRight(onLogout: () => void) {
  return function HeaderRight() {
    return <LogoutButton onPress={onLogout} />;
  };
}

// ─── Factories d'icônes d'onglets ────────────────────────────────────────────

function renderHomeIcon({color, focused}: {color: string; focused: boolean}) {
  return <TabIcon symbol="⌂" color={color} focused={focused} />;
}

function renderNewVisitIcon({color, focused}: {color: string; focused: boolean}) {
  return <TabIcon symbol="⊕" color={color} focused={focused} />;
}

function renderHistoryIcon({color, focused}: {color: string; focused: boolean}) {
  return <TabIcon symbol="☰" color={color} focused={focused} />;
}

// ─── Navigateur principal ────────────────────────────────────────────────────

export function AppNavigator({onLogout}: {onLogout: () => void}) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          // En-tête bleu RSU avec ombre
          headerStyle: {
            backgroundColor: Colors.primaryDark,
            ...Shadows.md,
          },
          headerTitleStyle: {
            color: Colors.textOnPrimary,
            fontSize: FontSize.lg,
            fontWeight: '800',
          },
          headerShadowVisible: false,
          // Logo RSU à gauche de chaque écran
          headerLeft: () => <HeaderLogo />,
          headerRight: makeHeaderRight(onLogout),

          // Barre d'onglets blanche avec ombre subtile
          tabBarStyle: {
            height: 68,
            paddingBottom: 8,
            paddingTop: 6,
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            ...Shadows.sm,
          },
          tabBarActiveTintColor:   Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 2,
          },
        }}>

        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title:        'Accueil',
            tabBarLabel:  'Accueil',
            tabBarIcon:   renderHomeIcon,
          }}
        />

        <Tab.Screen
          name="NewVisit"
          component={NewVisitScreen}
          options={{
            title:        'Nouvelle visite',
            tabBarLabel:  'Enregistrer',
            tabBarIcon:   renderNewVisitIcon,
          }}
        />

        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title:        'Historique',
            tabBarLabel:  'Historique',
            tabBarIcon:   renderHistoryIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // Icône d'onglet
  tabIconWrap: {
    width: 44,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    // Fond teinté bleu clair quand l'onglet est sélectionné
    backgroundColor: Colors.primaryFaint,
  },
  tabIconSymbol: {
    fontSize: 20,
  },

  // Logo dans l'en-tête
  headerLogo: {
    width: 38,
    height: 38,
    marginLeft: Spacing.md,
  },

  // Bouton de déconnexion
  logoutBtn: {
    marginRight: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  logoutBtnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
