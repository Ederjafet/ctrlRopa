import { useAppTheme } from '@/context/AppThemeContext';
import { StyleSheet, Text, TextProps } from 'react-native';

type Props = TextProps & {
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  bold?: boolean;
  color?: string;
};

export default function AppText({
  variant = 'body',
  bold = false,
  color,
  style,
  ...rest
}: Props) {
  const { theme } = useAppTheme();

  const textColor = color ?? theme.colors.text;

  return (
    <Text
      style={[
        styles.base,
        variantStyles[variant],
        {
          color: textColor,
          fontWeight: bold ? 'bold' : 'normal',
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});

const variantStyles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 31,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
  },
});
