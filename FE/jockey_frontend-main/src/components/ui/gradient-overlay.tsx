import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, type ViewProps } from 'react-native';

export interface GradientOverlayProps extends ViewProps {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
}

/** Absolute-fill linear gradient for media/hero overlays. */
export function GradientOverlay({ colors, locations, style, ...props }: GradientOverlayProps) {
  return (
    <LinearGradient
      colors={colors}
      locations={locations}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      {...props}
    />
  );
}
