import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Subject, SubjectCategory } from '../types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';

interface SubjectDrawerProps {
  categories: SubjectCategory[];
  subjects: Subject[];
  selectedSubject?: string;
  onSubjectSelect: (subject: Subject) => void;
  onClose: () => void;
  userCycle: 'O_LEVEL' | 'A_LEVEL';
  userOption: 'SCIENCE' | 'ARTS';
}

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

export const SubjectDrawer: React.FC<SubjectDrawerProps> = ({
  categories,
  subjects,
  selectedSubject,
  onSubjectSelect,
  onClose,
  userCycle,
  userOption,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSubjectsByCategory = (categoryName: string) => {
    return subjects.filter(subject => subject.category === categoryName);
  };

  const getCategorySubjectCount = (categoryName: string) => {
    return getSubjectsByCategory(categoryName).length;
  };

  const getDisplayCycle = () => {
    return userCycle === 'O_LEVEL' ? 'O Level' : 'A Level';
  };

  const getDisplayOption = () => {
    return userOption === 'SCIENCE' ? 'Science' : 'Arts';
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🎓</Text>
              <Text style={styles.title}>Study Helplanner</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>{getDisplayCycle()} • {getDisplayOption()}</Text>
          </View>
        </View>

        {/* Subjects List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SUBJECTS</Text>
            <TouchableOpacity style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </View>

          {categories.map((category) => {
            const categorySubjects = getSubjectsByCategory(category.name);
            const isExpanded = expandedCategories.includes(category.id);
            const subjectCount = getCategorySubjectCount(category.name);

            return (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.subjectCount}>{subjectCount}</Text>
                  </View>
                  <Text style={styles.chevron}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {isExpanded && categorySubjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.subjectItem,
                      selectedSubject === subject.id && styles.selectedSubject
                    ]}
                    onPress={() => onSubjectSelect(subject)}
                  >
                    <Text style={styles.subjectIcon}>📚</Text>
                    <Text style={[
                      styles.subjectName,
                      selectedSubject === subject.id && styles.selectedSubjectName
                    ]}>
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: COLORS.surface,
    height: '100%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontFamily: 'System',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: FONT_SIZES.xl,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
  },
  userInfo: {
    paddingBottom: SPACING.md,
  },
  userInfoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  settingsButton: {
    padding: SPACING.xs,
  },
  settingsIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  categoryContainer: {
    marginBottom: SPACING.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.input,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
  },
  subjectCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontFamily: 'System',
  },
  chevron: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginLeft: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectedSubject: {
    backgroundColor: COLORS.background,
  },
  subjectIcon: {
    fontSize: FONT_SIZES.sm,
    marginRight: SPACING.sm,
  },
  subjectName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontFamily: 'System',
  },
  selectedSubjectName: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
