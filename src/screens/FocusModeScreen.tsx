import React, { useState } from 'react';
import { View } from 'react-native';
import { FocusAwarenessScreen } from './FocusAwarenessScreen';
import { FocusSessionScreen } from './FocusSessionScreen';

type FocusModeStep = 'awareness' | 'session';

export const FocusModeScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<FocusModeStep>('awareness');

  const handleStartFocus = () => {
    setCurrentStep('session');
  };

  const handleExitFocus = () => {
    setCurrentStep('awareness');
  };

  return (
    <View style={{ flex: 1 }}>
      {currentStep === 'awareness' ? (
        <FocusAwarenessScreen onStartFocus={handleStartFocus} />
      ) : (
        <FocusSessionScreen onExit={handleExitFocus} />
      )}
    </View>
  );
};
