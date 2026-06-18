import { Platform } from 'react-native';

const API_PORT = process.env.EXPO_PUBLIC_API_PORT ?? '8090';
const QA_LAN_API_HOST = process.env.EXPO_PUBLIC_API_HOST ?? '192.168.0.128';

function resolveWebApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:${API_PORT}`;
  }

  return `http://${QA_LAN_API_HOST}:${API_PORT}`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'web'
    ? resolveWebApiBaseUrl()
    : `http://${QA_LAN_API_HOST}:${API_PORT}`);
