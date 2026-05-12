import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type DeviceClass = 'phone' | 'tablet' | 'desktop';

const TABLET_MIN_WIDTH = 600;
const DESKTOP_MIN_WIDTH = 1024;

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

    return {
      width,
      height,
      deviceClass,
      isPhone,
      isTablet,
      isDesktop,
      isCompactPhone: width < 380,
      contentMaxWidth: isDesktop ? 1180 : isTablet ? 760 : undefined,
      horizontalPadding: isPhone ? 16 : isTablet ? 24 : 32,
    };
  }, [height, width]);
}
