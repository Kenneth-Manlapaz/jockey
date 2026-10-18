import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag, Home, Medal, Radio, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

const TAB_ICONS: Record<string, LucideIcon> = {
  index: Home,
  races: Flag,
  live: Radio,
  results: Medal,
  profile: User,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  races: 'Races',
  live: 'Live',
  results: 'Results',
  profile: 'Profile',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-start border-t px-2 pt-2"
      style={{
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 10,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[route.name] ?? Home;
        const label = TAB_LABELS[route.name] ?? route.name;
        const color = isFocused ? colors.brand : colors.textInactive;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key]?.options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            className="flex-1 items-center gap-1"
          >
            <View className="items-center">
              {isFocused ? (
                <View
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: colors.accent, marginBottom: 3 }}
                />
              ) : null}
              <Icon size={20} color={color} strokeWidth={isFocused ? 2.4 : 2} />
            </View>
            <Text
              variant="caption"
              className={isFocused ? 'font-sans-bold' : 'font-sans-semibold'}
              style={{ color }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
