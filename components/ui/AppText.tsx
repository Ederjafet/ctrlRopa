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
    color: '#111111',
  },
});

const variantStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
  },
  caption: {
    fontSize: 12,
  },
});
