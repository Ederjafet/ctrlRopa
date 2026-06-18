import AppCard from '@/components/ui/AppCard';
import AppText from '@/components/ui/AppText';
import SectionHeader from '@/components/ui/SectionHeader';
import { designTokens } from '@/theme/designTokens';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  title: string;
  status?: ReactNode;
  steps?: ReactNode;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  content?: ReactNode;
};

export default function OperationalTemplate({
  title,
  status,
  steps,
  primaryAction,
  secondaryActions,
  content,
}: Props) {
  return (
    <View style={styles.root}>
      <SectionHeader title={title} />
      {status ? <AppCard style={styles.status}>{status}</AppCard> : null}
      {steps ? <View style={styles.steps}>{steps}</View> : null}
      {primaryAction ? <View style={styles.primaryAction}>{primaryAction}</View> : null}
      {secondaryActions ? <View style={styles.secondaryActions}>{secondaryActions}</View> : null}
      {content ? <View style={styles.content}>{content}</View> : null}
      {!steps && !content ? (
        <AppText variant="caption">Template operativo listo para PRODUCT-B3.</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: designTokens.spacing.md,
  },
  primaryAction: {
    marginBottom: designTokens.spacing.md,
  },
  root: {
    gap: designTokens.spacing.md,
    width: '100%',
  },
  secondaryActions: {
    marginBottom: designTokens.spacing.md,
  },
  status: {
    borderColor: designTokens.colors.success,
  },
  steps: {
    gap: designTokens.spacing.md,
  },
});
