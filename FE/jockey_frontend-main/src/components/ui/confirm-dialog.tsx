import { type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

/** Centered confirmation card used before placing demo tickets. */
export function ConfirmDialog({
  visible,
  title,
  description,
  icon,
  confirmLabel = 'Proceed',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  className,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
        onPress={onCancel}
        className="flex-1 items-center justify-center bg-black/40 p-6"
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className={cn('w-full max-w-[320px] items-center rounded-[20px] bg-white p-6', className)}
          style={{ backgroundColor: colors.surface }}
        >
          {icon ? (
            <View
              className="h-14 w-14 items-center justify-center rounded-3xl"
              style={{ backgroundColor: colors.surfaceMuted }}
            >
              {icon}
            </View>
          ) : null}
          <Text variant="title" className="pt-3.5 text-center">
            {title}
          </Text>
          {description ? (
            <View className="pt-2">
              {typeof description === 'string' ? (
                <Text variant="body" tone="secondary" className="text-center">
                  {description}
                </Text>
              ) : (
                description
              )}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            className="mt-4 h-12 items-center justify-center self-stretch rounded-2xl active:opacity-80"
            style={{ backgroundColor: colors.brand }}
          >
            <Text variant="label" style={{ color: colors.textInverse }}>
              {confirmLabel}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            className="mt-2.5 h-12 items-center justify-center self-stretch rounded-2xl active:opacity-70"
          >
            <Text variant="label" style={{ color: colors.brand }}>
              {cancelLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
