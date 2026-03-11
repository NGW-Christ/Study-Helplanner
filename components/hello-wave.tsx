import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  rotation.value = withRepeat(
    withTiming(25, { duration: 300, easing: Easing.inOut(Easing.ease) }),
    4,
    true
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}>
      👋
    </Animated.Text>
  );
}
