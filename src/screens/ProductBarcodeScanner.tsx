import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

interface ProductBarcodeScannerProps {
  onScanned: (barcode: string) => void;
  onCancel: () => void;
}

const ProductBarcodeScanner: React.FC<ProductBarcodeScannerProps> = ({ onScanned, onCancel }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
          setScanned(true);
          onScanned(data);
        }}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'qr', 'pdf417', 'aztec', 'itf14', 'datamatrix',
          ],
        }}
      />
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  cancelBtn: { position: 'absolute', top: 40, right: 24, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24, padding: 8 },
});

export default ProductBarcodeScanner;
