import AppButton from '@/components/ui/AppButton';
import AppText from '@/components/ui/AppText';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal, Platform, StyleSheet, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
};

export default function QRScannerModal({ visible, onClose, onScanned }: Props) {
  const [permission, requestPermission] = useCameraPermissions();

  const handleScan = ({ data }: { data: string }) => {
    if (!data) return;
    onScanned(data);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <AppText variant="title" bold color="#ffffff">
          Escanear QR
        </AppText>

        {Platform.OS === 'web' ? (
          <View style={styles.center}>
            <AppText color="#ffffff">
              El escaneo con cámara está disponible en celular/tablet.
            </AppText>

            <AppButton title="Cerrar" variant="secondary" onPress={onClose} />
          </View>
        ) : !permission?.granted ? (
          <View style={styles.center}>
            <AppText color="#ffffff">
              Necesitamos permiso para usar la cámara.
            </AppText>

            <AppButton title="Permitir cámara" onPress={requestPermission} />

            <View style={styles.spacing}>
              <AppButton title="Cancelar" variant="cancel" onPress={onClose} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.cameraWrapper}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
                onBarcodeScanned={handleScan}
              />
            </View>

            <AppText color="#ffffff" style={styles.help}>
              Apunta la cámara al QR de la prenda.
            </AppText>

            <AppButton title="Cerrar escáner" variant="secondary" onPress={onClose} />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    marginVertical: 20,
  },
  camera: {
    flex: 1,
  },
  help: {
    textAlign: 'center',
    marginBottom: 16,
  },
  spacing: {
    marginTop: 10,
  },
});
