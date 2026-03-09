import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Subject } from '../types';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../constants';
import { ActionCard } from './ActionCard';

const { height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.6;

interface ActionBottomSheetProps {
  visible: boolean;
  subject: Subject | null;
  onClose: () => void;
  onActionSelect: (action: string) => void;
}

export const ActionBottomSheet: React.FC<ActionBottomSheetProps> = ({
  visible,
  subject,
  onClose,
  onActionSelect,
}) => {
  const actions = [
    {
      id: 'quick_summary',
      title: 'Quick Summary',
      subtitle: 'Get a concise overview of a topic',
      icon: '📄',
    },
    {
      id: 'add_notes',
      title: 'Add Notes',
      subtitle: 'Paste or create your own study notes',
      icon: '📝',
    },
    {
      id: 'revise_topic',
      title: 'Revise Topic',
      subtitle: 'Practice and review specific topics',
      icon: '🔄',
    },
    {
      id: 'get_hints',
      title: 'Get Hints',
      subtitle: 'Receive helpful explanations and guidance',
      icon: '💡',
    },
    {
      id: 'plan_study_time',
      title: 'Plan Study Time',
      subtitle: 'Schedule and organize your study sessions',
      icon: '⏰',
    },
  ];

  const handleActionPress = (actionId: string) => {
    onActionSelect(actionId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{subject?.name || 'Select Action'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.content}>
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                onPress={() => handleActionPress(action.id)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.inputBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'System',
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
});
