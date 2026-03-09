import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { SelectionCard } from '../components/SelectionCard';
import { useAuth } from '../hooks/useAuth';
import { ProfileService } from '../services/profile';
import { CustomButton } from '../components/CustomButton';

type Cycle = 'O_LEVEL' | 'A_LEVEL';

export const SelectCycleScreen = () => {
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (selectedCycle) {
      setLoading(true);
      try {
        // Store cycle in user profile
        const success = await ProfileService.updateProfile({ cycle: selectedCycle });
        if (success) {
          router.push(`/select-option?cycle=${selectedCycle}` as const);
        }
      } catch (error) {
        console.error('Error saving cycle:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Level</Text>
        <Text style={styles.subtitle}>Choose your academic cycle</Text>
      </View>

      <View style={styles.content}>
        <SelectionCard
          title="O Level"
          subtitle="Form 5 - Ordinary Level"
          onPress={() => setSelectedCycle('O_LEVEL')}
          selected={selectedCycle === 'O_LEVEL'}
        />

        <SelectionCard
          title="A Level"
          subtitle="Advanced Level"
          onPress={() => setSelectedCycle('A_LEVEL')}
          selected={selectedCycle === 'A_LEVEL'}
        />
      </View>

      <View style={styles.footer}>
        <CustomButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedCycle || loading}
          loading={loading}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  footer: {
    padding: SPACING.lg,
  },
  continueButton: {
    marginTop: SPACING.md,
  },
});
