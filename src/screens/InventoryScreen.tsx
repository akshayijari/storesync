


import React, { useEffect, useState, useRef } from 'react';
// Prevent multiple alerts stacking on iOS
const isAlertVisibleRef = { current: false };
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, setProducts, setInventoryLoading } from '../store/store';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { FlatList, View, Text, TouchableOpacity, Modal, TextInput, Button, Alert, StyleSheet, RefreshControl } from 'react-native';
import InventoryBarcodeScanner from './InventoryBarcodeScanner';
import { getDocs, query, where } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  expirationDate: string;
  category: string;
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
  },
  editBtn: {
    marginLeft: 8,
    backgroundColor: '#4f8cff',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteBtn: {
    marginLeft: 8,
    backgroundColor: '#ff4f4f',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 44,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

type RootStackParamList = {
  Inventory: undefined | { scannedProduct?: Product };
  Scanner: { returnTo: string; forProduct: boolean };
  // add other screens if needed
};

const InventoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector((state: RootState) => state.inventory);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>({
    name: '',
    quantity: 0,
    price: 0,
    expirationDate: '',
    category: '',
  });

  // Listen for scannedProduct param and autofill form
  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = React.useCallback(() => {
    dispatch(setInventoryLoading(true));
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const productList: Product[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          quantity: Number(data.quantity),
          price: Number(data.price),
          expirationDate: data.expirationDate,
          category: data.category,
        };
      });
      dispatch(setProducts(productList));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (route.params && (route.params as any).scannedProduct) {
      const scanned = (route.params as any).scannedProduct;
      setForm(f => ({
        ...f,
        name: scanned.name || '',
        expirationDate: scanned.expirationDate || '',
        price: scanned.price || 0,
        category: scanned.category || '',
      }));
      setModalVisible(true);
      // Clear the param after use
      navigation.setParams?.({ scannedProduct: undefined });
    }
    const unsubscribe = fetchInventory();
    return () => unsubscribe();
  }, [dispatch, route.params, fetchInventory]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInventory();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchInventory]);

  const openModal = (product?: Product) => {
    if (product) {
      setEditProduct(product);
      const { id, ...rest } = product;
      setForm(rest);
      setModalVisible(true);
    } else {
      setEditProduct(null);
      setForm({ name: '', quantity: 0, price: 0, expirationDate: '', category: '' });
      setScanning(true);
    }
  };

  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setScanning(false);
    // Search for product in products collection
    try {
      const q = query(collection(db, 'products'), where('barcode', '==', barcode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setForm({
          name: data.name || '',
          quantity: Number(data.quantity) || 0,
          price: Number(data.price) || 0,
          expirationDate: data.expirationDate || '',
          category: data.category || '',
        });
        setEditProduct(null);
        setModalVisible(true);
      } else {
        if (!isAlertVisibleRef.current) {
          isAlertVisibleRef.current = true;
          Alert.alert(
            'Not found',
            'No product found for this barcode. Do you want to add this product?',
            [
              { text: 'No', style: 'cancel', onPress: () => { isAlertVisibleRef.current = false; } },
              { text: 'Yes', onPress: () => { isAlertVisibleRef.current = false; navigation.getParent()?.navigate('Products'); } },
            ],
            { cancelable: true, onDismiss: () => { isAlertVisibleRef.current = false; } }
          );
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to fetch product.');
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.category || !form.expirationDate) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    try {
      if (editProduct && editProduct.id) {
        await updateDoc(doc(db, 'inventory', editProduct.id), {
          ...form,
          quantity: Number(form.quantity),
          price: Number(form.price),
        });
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...form,
          quantity: Number(form.quantity),
          price: Number(form.price),
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'inventory', id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete product.');
          }
        }
      }
    ]);
  };

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>
      <FlatList
        data={products}
        keyExtractor={item => item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetail}>Qty: {item.quantity} | ${item.price}</Text>
              <Text style={styles.itemDetail}>Expires: {item.expirationDate}</Text>
              <Text style={styles.itemDetail}>Category: {item.category}</Text>
            </View>
            <TouchableOpacity onPress={() => openModal(item)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => item.id && handleDelete(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No products found.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
        <Text style={styles.addBtnText}>+ Add Product</Text>
      </TouchableOpacity>
      {/* Barcode Scanner Modal */}
      <Modal visible={scanning} animationType="slide" transparent>
        <InventoryBarcodeScanner
          onScanned={handleBarcodeScanned}
          onCancel={() => setScanning(false)}
        />
      </Modal>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editProduct ? 'Edit Product' : 'Add Product'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />
            <TouchableOpacity
              style={[styles.addBtn, { marginBottom: 8, marginTop: 0 }]}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('Scanner', { returnTo: 'Inventory', forProduct: true });
              }}
            >
              <Text style={styles.addBtnText}>Scan Barcode</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={form.quantity.toString()}
              onChangeText={v => setForm(f => ({ ...f, quantity: Number(v) }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Price"
              keyboardType="numeric"
              value={form.price.toString()}
              onChangeText={v => setForm(f => ({ ...f, price: Number(v) }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Expiration Date (YYYY-MM-DD)"
              value={form.expirationDate}
              onChangeText={v => setForm(f => ({ ...f, expirationDate: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Category"
              value={form.category}
              onChangeText={v => setForm(f => ({ ...f, category: v }))}
            />
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#888" />
              <Button title={editProduct ? 'Update' : 'Add'} onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InventoryScreen;