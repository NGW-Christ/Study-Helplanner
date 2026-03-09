import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { HomeScreen } from '../../src/screens/HomeScreen';

export default function MainHomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return null; // Will be handled by auth guard
  }

  return (
    <View style={{ flex: 1 }}>
      <HomeScreen 
        userCycle={user.cycle}
        userOption={user.option}
      />
    </View>
  );
}
