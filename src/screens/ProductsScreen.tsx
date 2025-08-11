import React, { useEffect, useState } from 'react';
import ProductBarcodeScanner from './ProductBarcodeScanner';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Button, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Image } from 'react-native';
import CategoryDropdown from '../components/CategoryDropdown';
import CategoryFilterModal from '../components/CategoryFilterModal';
const Header: React.FC<{ navigation?: any }> = ({ navigation }) => (
  <View style={headerStyles.header}>
    <TouchableOpacity
      onPress={() => navigation?.canGoBack?.() ? navigation.goBack() : null}
      style={headerStyles.leftBtn}
    >
      <Text style={headerStyles.leftBtnText}>{Platform.OS === 'ios' ? '‹' : '<'}</Text>
    </TouchableOpacity>
    <Image source={require('../../assets/logo.png')} style={headerStyles.logo} resizeMode="contain" />
    <TouchableOpacity
      onPress={() => navigation?.openDrawer?.()}
      style={headerStyles.rightBtn}
    >
      <Text style={headerStyles.rightBtnText}>☰</Text>
    </TouchableOpacity>
  </View>
);

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    backgroundColor: '#c7d9fcff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  leftBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBtnText: {
    fontSize: 28,
    color: '#4f8cff',
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? 2 : 0,
  },
  logo: {
    width: 60,
    height: 60,
    flex: 1,
    alignSelf: 'center',
  },
  rightBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBtnText: {
    fontSize: 24,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
});
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Product {
  id: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  unit: string;
  imageUrl: string;
  expirationDate: string;
  attributes: Record<string, any>;
  createdAt: any;
  updatedAt: any;
  isActive: boolean;
}

const defaultForm: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  barcode: '',
  name: '',
  description: '',
  category: '',
  brand: '',
  price: 0,
  unit: '',
  imageUrl: '',
  expirationDate: '',
  attributes: {},
  isActive: true,
};

const ProductsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form, setForm] = useState<typeof defaultForm>(defaultForm);
  const [attributeFields, setAttributeFields] = useState<{ key: string; value: string }[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const q = collection(db, 'products');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Product[] = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Product));
      setProducts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
    return matchesSearch && matchesCategory;
  });

  const openAddModal = () => {
    setForm(defaultForm);
    setEditId(null);
    setAttributeFields([]);
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setForm({ ...product });
    setEditId(product.id);
    // Convert attributes object to array for editing
    const attrs = product.attributes && typeof product.attributes === 'object'
      ? Object.entries(product.attributes).map(([key, value]) => ({ key, value: String(value) }))
      : [];
    setAttributeFields(attrs);
    setModalVisible(true);
  };

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const handleSave = async () => {
    // Validate all fields except attributes
    if (!form.barcode || !form.name || !form.description || !form.category || !form.brand || !form.price || !form.unit || !form.expirationDate) {
      Alert.alert('Error', 'All fields except attributes are mandatory.');
      return;
    }
    // Validate attribute fields (no empty key if value is present)
    for (const attr of attributeFields) {
      if ((attr.key && !attr.value) || (!attr.key && attr.value)) {
        Alert.alert('Error', 'Attribute key and value must both be filled or both be empty.');
        return;
      }
    }
    // Convert attributeFields to object
    const attributesObj = attributeFields.reduce((acc, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
    try {
      if (editId) {
        await updateDoc(doc(db, 'products', editId), {
          ...form,
          attributes: attributesObj,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...form,
          attributes: attributesObj,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
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
            await deleteDoc(doc(db, 'products', id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete product.');
          }
        }
      }
    ]);
  };


  // Real barcode scanning
  const handleScanBarcode = () => {
    setModalVisible(false);
    setTimeout(() => setScanning(true), 300);
  };
  const handleBarcodeScanned = (barcode: string) => {
    setForm(f => ({ ...f, barcode }));
    setScanning(false);
    setTimeout(() => setModalVisible(true), 300);
    Alert.alert('Barcode Scanned', `Barcode: ${barcode}`);
  };

  return (
    <View >
      <Header navigation={navigation} />
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by name or barcode"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setCategoryModalVisible(true)}>
          <Ionicons name="filter" size={28} color={selectedCategories.length ? '#4f8cff' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add-circle" size={32} color="#4f8cff" />
        </TouchableOpacity>
      </View>
      <CategoryFilterModal
        visible={categoryModalVisible}
        selected={selectedCategories}
        onClose={() => setCategoryModalVisible(false)}
        onSelect={cats => setSelectedCategories(cats)}
      />
      {loading ? <ActivityIndicator size="large" color="#4f8cff" /> : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          style={{ margin: 10, marginBottom: 200, padding: 2 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => openDetailModal(item)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetail}>Barcode: {item.barcode}</Text>
                <Text style={styles.itemDetail}>Category: {item.category}</Text>
                <Text style={styles.itemDetail}>Brand: {item.brand}</Text>
                <Text style={styles.itemDetail}>Price: ₹{item.price}</Text>
                <Text style={styles.itemDetail}>Unit: {item.unit}</Text>
                <Text style={styles.itemDetail}>Active: {item.isActive ? 'Yes' : 'No'}</Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No products found.</Text>}
        />
      )}
      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.scrollModalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity style={styles.scanBtn} onPress={handleScanBarcode}>
                <Ionicons name="barcode-outline" size={24} color="#fff" />
                <Text style={styles.scanBtnText}>Scan Barcode</Text>
              </TouchableOpacity>
              <TextInput style={styles.inputField} placeholder="Barcode" placeholderTextColor="#888" value={form.barcode} onChangeText={v => setForm(f => ({ ...f, barcode: v }))} />
              <TextInput style={styles.inputField} placeholder="Name" placeholderTextColor="#888" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} />
              <TextInput style={styles.inputField} placeholder="Description" placeholderTextColor="#888" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} />
              <CategoryDropdown value={form.category} onChange={cat => setForm(f => ({ ...f, category: cat }))} label="Category" />
              <TextInput style={styles.inputField} placeholder="Brand" placeholderTextColor="#888" value={form.brand} onChangeText={v => setForm(f => ({ ...f, brand: v }))} />
              <TextInput style={styles.inputField} placeholder="Price" placeholderTextColor="#888" keyboardType="numeric" value={form.price.toString()} onChangeText={v => setForm(f => ({ ...f, price: Number(v) }))} />
              <TextInput style={styles.inputField} placeholder="Unit" placeholderTextColor="#888" value={form.unit} onChangeText={v => setForm(f => ({ ...f, unit: v }))} />
              <TextInput style={styles.inputField} placeholder="Image URL" placeholderTextColor="#888" value={form.imageUrl} onChangeText={v => setForm(f => ({ ...f, imageUrl: v }))} />
              <TextInput style={styles.inputField} placeholder="Expiration Date (YYYY-MM-DD)" placeholderTextColor="#888" value={form.expirationDate} onChangeText={v => setForm(f => ({ ...f, expirationDate: v }))} />
              {/* Dynamic attributes */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Attributes (optional)</Text>
                {attributeFields.map((attr, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <TextInput
                      style={[styles.inputField, { flex: 1, marginRight: 8 }]}
                      placeholder="Key"
                      placeholderTextColor="#888"
                      value={attr.key}
                      onChangeText={v => setAttributeFields(fields => fields.map((a, i) => i === idx ? { ...a, key: v } : a))}
                    />
                    <TextInput
                      style={[styles.inputField, { flex: 1 }]}
                      placeholder="Value"
                      placeholderTextColor="#888"
                      value={attr.value}
                      onChangeText={v => setAttributeFields(fields => fields.map((a, i) => i === idx ? { ...a, value: v } : a))}
                    />
                    <TouchableOpacity onPress={() => setAttributeFields(fields => fields.filter((_, i) => i !== idx))}>
                      <Ionicons name="remove-circle" size={24} color="#ff4f4f" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setAttributeFields(fields => [...fields, { key: '', value: '' }])} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="add-circle" size={22} color="#4f8cff" />
                  <Text style={{ color: '#4f8cff', marginLeft: 6 }}>Add Attribute</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActionsScroll}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} color="#888" />
                <Button title={editId ? 'Update' : 'Add'} onPress={handleSave} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Barcode Scanner Modal */}
      <Modal visible={scanning} animationType="slide" transparent>
        <ProductBarcodeScanner
          onScanned={handleBarcodeScanned}
          onCancel={() => setScanning(false)}
        />
      </Modal>
      {/* Detail Modal */}
      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <View style={styles.scrollModalContentWrapper}>
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text>Barcode: {selectedProduct.barcode}</Text>
                <Text>Description: {selectedProduct.description}</Text>
                <Text>Category: {selectedProduct.category}</Text>
                <Text>Brand: {selectedProduct.brand}</Text>
                <Text>Price: ₹{selectedProduct.price}</Text>
                <Text>Unit: {selectedProduct.unit}</Text>
                <Text>Image: {selectedProduct.imageUrl}</Text>
                <Text>Expiration: {selectedProduct.expirationDate}</Text>
                <Text>Attributes: {JSON.stringify(selectedProduct.attributes)}</Text>
                <Text>Active: {selectedProduct.isActive ? 'Yes' : 'No'}</Text>
                <Text>Created: {selectedProduct.createdAt?.toDate?.().toLocaleString?.() || ''}</Text>
                <Text>Updated: {selectedProduct.updatedAt?.toDate?.().toLocaleString?.() || ''}</Text>
              </View>
            )}
            <Button title="Close" onPress={() => setDetailModalVisible(false)} />
          </View>
        </View>
      </Modal>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa', padding: 16, marginTop: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#222', textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12 },
  input: { flex: 1, height: 40, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 16, backgroundColor: '#f9f9f9' },
  inputField: { width: '100%', height: 44, borderColor: '#e0e0e0', borderWidth: 1, borderRadius: 8, marginBottom: 16, paddingHorizontal: 10, fontSize: 16, backgroundColor: '#f9f9f9' },
  scrollModalContentWrapper: { paddingBottom: 24},
  scrollModalContent: { paddingBottom: 24 },
  modalActionsScroll: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  addBtn: { marginLeft: 8, backgroundColor: 'transparent' },
  filterBtn: { marginLeft: 8, marginRight: 4, backgroundColor: 'transparent', padding: 4 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemDetail: { fontSize: 14, color: '#666' },
  editBtn: { marginLeft: 8, backgroundColor: '#4f8cff', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  deleteBtn: { marginLeft: 8, backgroundColor: '#ff4f4f', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#222', textAlign: 'center' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f8cff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12 },
  scanBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

export default ProductsScreen;
