import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Subject, SubjectCategory } from '../types';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';
import { SubjectDrawer } from '../components/SubjectDrawer';
import { ActionBottomSheet } from '../components/ActionBottomSheet';
import { ActionCard } from '../components/ActionCard';
import { useSubjects } from '../hooks/useSubjects';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  userCycle: 'O_LEVEL' | 'A_LEVEL';
  userOption: 'SCIENCE' | 'ARTS';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userCycle,
  userOption,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  
  // Use the useSubjects hook to get real data
  const { categories, subjects, loading } = useSubjects();

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setDrawerVisible(false);
    setActionSheetVisible(true);
  };

  const handleActionSelect = (action: string) => {
    // Handle action selection - will implement AI logic later
    console.log(`Action selected: ${action} for subject: ${selectedSubject?.name}`);
    // For now, just log the action
  };

  const getDisplayCycle = () => {
    return userCycle === 'O_LEVEL' ? 'O Level' : 'A Level';
  };

  const getDisplayOption = () => {
    return userOption === 'SCIENCE' ? 'Science' : 'Arts';
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>{getDisplayCycle()} • {getDisplayOption()}</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {selectedSubject ? (
          <View style={styles.subjectContent}>
            <Text style={styles.subjectTitle}>{selectedSubject.name}</Text>
            <Text style={styles.subjectDescription}>{selectedSubject.description}</Text>
            
            {/* Quick Action Cards */}
            <View style={styles.quickActions}>
              <ActionCard
                title="Quick Summary"
                subtitle="Get a concise overview of a topic"
                icon="📄"
                onPress={() => handleActionSelect('quick_summary')}
              />
              <ActionCard
                title="Add Notes"
                subtitle="Paste or create your own study notes"
                icon="📝"
                onPress={() => handleActionSelect('add_notes')}
              />
              <ActionCard
                title="Revise Topic"
                subtitle="Practice and review specific topics"
                icon="🔄"
                onPress={() => handleActionSelect('revise_topic')}
              />
              <ActionCard
                title="Get Hints"
                subtitle="Receive helpful explanations and guidance"
                icon="💡"
                onPress={() => handleActionSelect('get_hints')}
              />
              <ActionCard
                title="Plan Study Time"
                subtitle="Schedule and organize your study sessions"
                icon="⏰"
                onPress={() => handleActionSelect('plan_study_time')}
              />
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.placeholderIcon}>
              <Text style={styles.placeholderIconText}>📚</Text>
            </View>
            <Text style={styles.placeholderTitle}>Select a subject to begin</Text>
            <Text style={styles.placeholderDescription}>
              Select a subject from the sidebar to access study materials, summaries, and guided learning resources.
            </Text>
          </View>
        )}
      </View>

      {/* Help Button */}
      <TouchableOpacity style={styles.helpButton}>
        <Text style={styles.helpIcon}>?</Text>
      </TouchableOpacity>

      {/* Subject Drawer */}
      {drawerVisible && (
        <SubjectDrawer
          categories={categories}
          subjects={subjects}
          selectedSubject={selectedSubject?.id}
          onSubjectSelect={handleSubjectSelect}
          onClose={() => setDrawerVisible(false)}
          userCycle={userCycle}
          userOption={userOption}
        />
      )}

      {/* Action Bottom Sheet */}
      <ActionBottomSheet
        visible={actionSheetVisible}
        subject={selectedSubject}
        onClose={() => setActionSheetVisible(false)}
        onActionSelect={handleActionSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  menuIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontFamily: 'System',
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  subjectContent: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  subjectDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
    fontFamily: 'System',
  },
  quickActions: {
    flex: 1,
  },
  actionButtons: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  actionButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'System',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  placeholderIconText: {
    fontSize: FONT_SIZES.xxxl,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  placeholderDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.xl,
    fontFamily: 'System',
  },
  helpButton: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helpIcon: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.surface,
    fontWeight: '600',
    fontFamily: 'System',
  },
});
