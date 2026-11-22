import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.row}>
      <SkeletonLoader width={48} height={48} borderRadius={24} />
      <View style={styles.col}>
        <SkeletonLoader width="60%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="40%" height={12} borderRadius={4} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginTop: 14 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#CBD5E1',
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    marginLeft: 12,
  },
});

export default SkeletonLoader;
