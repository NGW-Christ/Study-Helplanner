import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FocusModeScreen } from '../src/screens/FocusModeScreen';
import { COLORS } from '../src/constants';

export default function FocusScreen() {
  return (
    <View style={styles.container}>
      <FocusModeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
