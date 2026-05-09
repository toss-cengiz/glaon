// Pure-props card component used by the mode-select screen. Stays free
// of data fetching per the component-data-fetching boundary.

import { Pressable, StyleSheet, Text } from 'react-native';
import type { ReactNode } from 'react';

interface ModeSelectorCardProps {
  readonly mode: 'local' | 'cloud';
  readonly title: string;
  readonly description: string;
  readonly meta?: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

export function ModeSelectorCard({
  mode,
  title,
  description,
  meta,
  disabled = false,
  onSelect,
}: ModeSelectorCardProps): ReactNode {
  return (
    <Pressable
      testID={`mode-card-${mode}`}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onSelect}
      style={[styles.card, disabled ? styles.cardDisabled : null]}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {meta !== undefined && meta.length > 0 ? (
        <Text testID={`mode-card-${mode}-meta`} style={styles.meta}>
          {meta}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  cardDisabled: {
    backgroundColor: '#f3f5f8',
    opacity: 0.7,
  },
  title: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 14, color: '#5b6770', marginTop: 4 },
  meta: { fontSize: 13, marginTop: 8 },
});
