import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { designTokens } from '@/theme/designTokens';

export type DeviceClass = 'phone' | 'tablet' | 'desktop';

const TABLET_MIN_WIDTH = designTokens.breakpoints.tablet;
const DESKTOP_MIN_WIDTH = designTokens.breakpoints.desktop;
const DESKTOP_WIDE_MIN_WIDTH = designTokens.breakpoints.desktopWide;

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const deviceClass: DeviceClass =
      width >= DESKTOP_MIN_WIDTH
        ? 'desktop'
        : width >= TABLET_MIN_WIDTH
          ? 'tablet'
          : 'phone';

    const isPhone = deviceClass === 'phone';
    const isTablet = deviceClass === 'tablet';
    const isDesktop = deviceClass === 'desktop';
    const isWideDesktop = width >= DESKTOP_WIDE_MIN_WIDTH;

    return {
      width,
      height,
      deviceClass,
      isPhone,
      isTablet,
      isDesktop,
      isWideDesktop,
      isCompactPhone: width < 380,
      contentMaxWidth: isWideDesktop
        ? designTokens.layout.contentMaxWidth
        : isDesktop
          ? 1040
          : isTablet
            ? 860
            : undefined,
      horizontalPadding: isPhone
        ? designTokens.layout.pagePaddingMobile
        : isTablet
          ? designTokens.layout.pagePaddingTablet
          : designTokens.layout.pagePaddingDesktop,
    };
  }, [height, width]);
}
