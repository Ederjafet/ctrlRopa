import AppText from '@/components/ui/AppText';
import { useAppTheme } from '@/context/AppThemeContext';
import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
};

export default function SectionHeader({ title, subtitle, rightContent }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.header}>
      <View style={styles.text}>
        <AppText variant="subtitle" bold>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={theme.colors.mutedText}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md,
    marginTop: designTokens.spacing.xs,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
});
