import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { CustomButton } from '../components/CustomButton';

interface FocusAwarenessScreenProps {
  onStartFocus: () => void;
}

export const FocusAwarenessScreen: React.FC<FocusAwarenessScreenProps> = ({
  onStartFocus,
}) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎯</Text>
        </View>
        
        <Text style={styles.title}>Focus Mode</Text>
        <Text style={styles.subtitle}>Maximize your study potential</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What is Focus Mode?</Text>
          <Text style={styles.infoText}>
            Focus Mode creates an optimal study environment by minimizing distractions and helping you maintain deep concentration on your subjects.
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Eliminate digital distractions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Improve concentration and retention</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Build consistent study habits</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Track your study progress</Text>
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Before you start:</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>Enable Do Not Disturb on your device</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>Find a quiet study space</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>Have your study materials ready</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>4</Text>
            <Text style={styles.tipText}>Choose a comfortable session duration</Text>
          </View>
        </View>

        <CustomButton
          title="Start Focus Session"
          onPress={onStartFocus}
          style={styles.startButton}
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.surface,
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
    marginBottom: SPACING.xl,
    fontFamily: 'System',
  },
  infoSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  infoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontFamily: 'System',
  },
  benefitsSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  benefitIcon: {
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    fontWeight: '600',
    marginRight: SPACING.sm,
    fontFamily: 'System',
  },
  benefitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    fontFamily: 'System',
  },
  tipsSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    color: COLORS.surface,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: SPACING.sm,
    fontFamily: 'System',
  },
  tipText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    fontFamily: 'System',
  },
  startButton: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
});
