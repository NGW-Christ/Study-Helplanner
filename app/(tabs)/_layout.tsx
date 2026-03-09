import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { COLORS, SPACING } from '../../src/constants';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.inputBorder,
        },
        tabBarItemStyle: {
          paddingVertical: SPACING.sm,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🎯</Text>
          ),
        }}
      />
    </Tabs>
  );
}
