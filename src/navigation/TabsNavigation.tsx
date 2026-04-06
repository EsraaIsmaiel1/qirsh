import Feather from '@expo/vector-icons/Feather';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/src/components/HapticTab';
import type { WalletPalette } from '@/src/utils/wallet-theme';
import { useWalletTheme } from '@/src/store/wallet-theme-store';

export default function AppTabsLayout() {
  const { palette } = useWalletTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          minHeight: Platform.OS === 'ios' ? 88 : 80,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 6 },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabSlot focused={focused} palette={palette}>
              <Feather
                name="home"
                size={size ?? 22}
                color={focused ? palette.primaryForeground : color}
              />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused, color, size }) => (
            <TabSlot focused={focused} palette={palette}>
              <FontAwesome5
                name="receipt"
                size={size ?? 22}
                color={focused ? palette.primaryForeground : color}
              />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color, size }) => (
            <TabSlot focused={focused} palette={palette}>
              <Feather
                name="pie-chart"
                size={size ?? 22}
                color={focused ? palette.primaryForeground : color}
              />
            </TabSlot>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <TabSlot focused={focused} palette={palette}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={size ?? 22}
                color={focused ? palette.primaryForeground : color}
              />
            </TabSlot>
          ),
        }}
      />
    </Tabs>
  );
}

function TabSlot({
  focused,
  palette,
  children,
}: {
  focused: boolean;
  palette: WalletPalette;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: palette.primary }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },
});
