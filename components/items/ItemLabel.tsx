import { Item } from '@/services/itemService';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

type Props = {
  item: Item;
};

export default function ItemLabel({ item }: Props) {
  const qrValue = item.qrCode || item.code;
  const productTypeName = item.productTypeName || 'Sin tipo';
  const sizeName = item.sizeName || 'Sin talla';
  const batchText = item.batchFolio || item.batchId || 'Sin lote';

  return (
    <View style={styles.label}>
      <QRCode value={qrValue} size={130} backgroundColor="#ffffff" color="#000000" />

      <Text style={[styles.text, styles.code]}>{item.code}</Text>
      <Text style={styles.text}>{productTypeName}</Text>
      <Text style={styles.text}>Talla: {sizeName}</Text>
      <Text style={styles.text}>Lote: {batchText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
  },
  text: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  code: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: '700',
  },
});
