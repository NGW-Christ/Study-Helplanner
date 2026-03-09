import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants';

interface FocusSessionScreenProps {
  onExit: () => void;
  initialDuration?: number;
}

const DURATION_OPTIONS = [20, 25, 30, 45, 60]; // minutes

export const FocusSessionScreen: React.FC<FocusSessionScreenProps> = ({
  onExit,
  initialDuration = 25,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [timeRemaining, setTimeRemaining] = useState(selectedDuration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const clockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update clock every second
    clockIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (clockIntervalRef.current) {
        clearInterval(clockIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const handleSessionComplete = () => {
    Alert.alert(
      'Focus Session Complete!',
      `Great job! You completed ${selectedDuration} minutes of focused study.`,
      [
        {
          text: 'Start New Session',
          onPress: () => {
            setTimeRemaining(selectedDuration * 60);
            setIsRunning(false);
          },
        },
        {
          text: 'Exit Focus Mode',
          onPress: onExit,
          style: 'cancel',
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatClockTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleStartPause = () => {
    if (timeRemaining === 0) {
      setTimeRemaining(selectedDuration * 60);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(selectedDuration * 60);
  };

  const handleDurationSelect = (duration: number) => {
    if (!isRunning) {
      setSelectedDuration(duration);
      setTimeRemaining(duration * 60);
    }
  };

  const handleExit = () => {
    if (isRunning) {
      Alert.alert(
        'Exit Focus Mode?',
        'Your focus session is still in progress. Are you sure you want to exit?',
        [
          {
            text: 'Continue Session',
            style: 'cancel',
          },
          {
            text: 'Exit',
            onPress: onExit,
            style: 'destructive',
          },
        ]
      );
    } else {
      onExit();
    }
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;

  return (
    <View style={styles.container}>
      {/* Exit Button */}
      <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
        <Text style={styles.exitButtonText}>✕ Exit</Text>
      </TouchableOpacity>

      {/* Real-time Clock */}
      <View style={styles.clockContainer}>
        <Text style={styles.clockText}>{formatClockTime(currentTime)}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          
          {/* Progress Ring */}
          <View style={styles.progressRing}>
            <View 
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]} 
            />
          </View>
        </View>

        <Text style={styles.statusText}>
          {isRunning ? 'Stay focused!' : timeRemaining === 0 ? 'Session complete!' : 'Ready to focus'}
        </Text>

        {/* Duration Selector */}
        {!isRunning && (
          <View style={styles.durationSection}>
            <Text style={styles.durationTitle}>Session Duration</Text>
            <View style={styles.durationOptions}>
              {DURATION_OPTIONS.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    selectedDuration === duration && styles.selectedDuration,
                  ]}
                  onPress={() => handleDurationSelect(duration)}
                >
                  <Text style={[
                    styles.durationText,
                    selectedDuration === duration && styles.selectedDurationText,
                  ]}>
                    {duration}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.primaryControl,
              !isRunning && timeRemaining === 0 && styles.disabledControl,
            ]}
            onPress={handleStartPause}
            disabled={!isRunning && timeRemaining === 0}
          >
            <Text style={[
              styles.controlButtonText,
              styles.primaryButtonText
            ]}>
              {isRunning ? 'Pause' : timeRemaining === 0 ? 'Start' : 'Resume'}
            </Text>
          </TouchableOpacity>

          {!isRunning && timeRemaining > 0 && (
            <TouchableOpacity
              style={[styles.controlButton, styles.secondaryControl]}
              onPress={handleReset}
            >
              <Text style={[
                styles.controlButtonText,
                styles.secondaryButtonText
              ]}>
                Reset
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  exitButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: 'System',
  },
  clockContainer: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  clockText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '600',
    fontFamily: 'System',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
  },
  timerText: {
    fontSize: 72,
    fontWeight: '300',
    color: COLORS.text,
    fontFamily: 'System',
  },
  progressRing: {
    width: 200,
    height: 4,
    backgroundColor: COLORS.input,
    borderRadius: 2,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  statusText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontFamily: 'System',
  },
  durationSection: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  durationTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: 'System',
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  durationOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedDuration: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
    fontFamily: 'System',
  },
  selectedDurationText: {
    color: COLORS.surface,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  controlButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  primaryControl: {
    backgroundColor: COLORS.primary,
  },
  secondaryControl: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  disabledControl: {
    backgroundColor: COLORS.input,
    opacity: 0.6,
  },
  controlButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    fontFamily: 'System',
  },
  primaryButtonText: {
    color: COLORS.surface,
  },
  secondaryButtonText: {
    color: COLORS.text,
  },
});
