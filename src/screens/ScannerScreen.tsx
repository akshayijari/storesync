import { Camera, CameraType, CameraView } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
// import { BarCodeScanner } from 'expo-barcode-scanner';


const ScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const cameraRef = useRef<CameraView>(null);
  const [barcodes, setBarcodes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Barcode scanning handler
  const onBarCodeScanned = (barcode: string) => {
    setScanned(true);
    console.log('Barcode scanned:', barcode);
    // Simulate fetching product info from barcode (replace with real fetch if needed)
    const fetchedProduct = {
      name: 'Sample Product',
      expirationDate: '2026-12-31',
      price: 9.99,
      category: 'Groceries',
      barcode,
    };
    setProduct(fetchedProduct);
    setModalVisible(true);
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => onBarCodeScanned(data)}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code128', 'qr', 'pdf417', 'aztec', 'itf14', 'datamatrix',
          ],
        }}
      />
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Product Details</Text>
            {product && (
              <>
                <Text>Name: {product.name}</Text>
                <Text>Category: {product.category}</Text>
                <Text>Price: ₹{product.price}</Text>
                <Text>Expiry: {product.expirationDate}</Text>
                <Text>Barcode: {product.barcode}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setModalVisible(false);
                setScanned(false);
                // @ts-ignore: navigation type for nested navigators
                (navigation as any).navigate('MainTabs', {
                  screen: 'Inventory',
                  params: { scannedProduct: product },
                });
              }}
            >
              <Text style={styles.modalBtnText}>Use This Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#aaa', marginTop: 8 }]}
              onPress={() => {
                setModalVisible(false);
                setScanned(false);
              }}
            >
              <Text style={styles.modalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ScannerScreen;