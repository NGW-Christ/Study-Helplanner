import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { SelectionCard } from '../components/SelectionCard';
import { useAuth } from '../hooks/useAuth';
import { ProfileService } from '../services/profile';
import { CustomButton } from '../components/CustomButton';

type Option = 'SCIENCE' | 'ARTS';
type Cycle = 'O_LEVEL' | 'A_LEVEL';

export const SelectOptionScreen = () => {
  const { cycle } = useLocalSearchParams<{ cycle: Cycle }>();
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cycle) {
      router.replace('/onboarding');
    }
  }, [cycle]);

  const handleContinue = async () => {
    if (selectedOption && cycle) {
      setLoading(true);
      try {
        // Save both cycle and option to user profile
        const success = await ProfileService.updateProfile({ 
          cycle: cycle as Cycle,
          option: selectedOption 
        });
        
        if (success) {
          // Navigate to main app
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error saving profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Option</Text>
        <Text style={styles.subtitle}>Choose your field of study</Text>
      </View>

      <View style={styles.content}>
        <SelectionCard
          title="Science"
          subtitle="Mathematics, Physics, Chemistry, Biology"
          onPress={() => setSelectedOption('SCIENCE')}
          selected={selectedOption === 'SCIENCE'}
        />

        <SelectionCard
          title="Arts"
          subtitle="Literature, History, Philosophy, Languages"
          onPress={() => setSelectedOption('ARTS')}
          selected={selectedOption === 'ARTS'}
        />
      </View>

      <View style={styles.footer}>
        <CustomButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedOption}
          loading={loading}
          style={styles.button}
        />
        
        <CustomButton
          title="Back"
          onPress={handleBack}
          variant="secondary"
          style={styles.backButton}
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
    paddingBottom: SPACING.lg,
  },
  button: {
    marginBottom: SPACING.md,
  },
  backButton: {
    marginBottom: SPACING.lg,
  },
});
