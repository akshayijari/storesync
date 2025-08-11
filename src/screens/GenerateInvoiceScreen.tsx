import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Button, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const STORE_INFO = {
  name: 'StoreSync Mart',
  address: '123 Main St, City, State',
  contact: '+91-9876543210',
};


type RootStackParamList = {
  Scanner: { returnTo: string; forProduct: boolean };
  GenerateInvoice: undefined;
};

const GenerateInvoiceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({ name: '', price: '', category: '', quantity: '' });
  const [modeOfPayment, setModeOfPayment] = useState('Cash');
  const [generating, setGenerating] = useState(false);
  const [invoiceNo] = useState(() => 'INV' + Date.now());

  // Autofill product form if coming from Scanner
  React.useEffect(() => {
    // Use navigation.replace to update params and avoid type errors
    if (route.params && (route.params as any).scannedProduct) {
      const scanned = (route.params as any).scannedProduct;
      setProductForm(f => ({
        ...f,
        name: scanned.name || '',
        price: scanned.price ? String(scanned.price) : '',
        category: scanned.category || '',
      }));
      // Clear param by replacing route with no params
      navigation.setParams(undefined);
    }
  }, [route.params]);

  const addProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.category || !productForm.quantity) {
      Alert.alert('Error', 'Fill all product fields');
      return;
    }
    setProducts(prev => [...prev, {
      ...productForm,
      price: parseFloat(productForm.price),
      quantity: parseInt(productForm.quantity),
      value: parseFloat(productForm.price) * parseInt(productForm.quantity),
    }]);
    setProductForm({ name: '', price: '', category: '', quantity: '' });
  };

  const totalValue = products.reduce((sum, p) => sum + (p.value || 0), 0);

  const handleScan = () => {
    navigation.navigate('Scanner', { returnTo: 'GenerateInvoice', forProduct: true });
  };

  const handleGenerate = async () => {
    if (!customerName || !customerMobile || products.length === 0) {
      Alert.alert('Error', 'Enter customer name, mobile and add at least one product.');
      return;
    }
    setGenerating(true);
    const invoice = {
      invoiceNo,
      store: STORE_INFO,
      customerName,
      customerMobile,
      products,
      totalValue,
      modeOfPayment,
      createdAt: Timestamp.now(),
    };
    try {
      await addDoc(collection(db, 'invoices'), invoice);
      const productLines = products.map(
        p => `${p.name} (${p.category}) x${p.quantity} @ ₹${p.price} = ₹${p.value}`
      ).join('%0A');
      const billMsg =
        `*${STORE_INFO.name}*\n${STORE_INFO.address}\nContact: ${STORE_INFO.contact}\n` +
        `Invoice No: ${invoiceNo}\nCustomer: ${customerName} (${customerMobile})\nDate: ${new Date().toLocaleDateString()}\n` +
        `\n*Products:*\n${productLines}\n\n*Total: ₹${totalValue.toFixed(2)}*\nPayment: ${modeOfPayment}`;
      Alert.alert(
        'Invoice Generated',
        'Do you want to send this invoice to WhatsApp?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.getParent()?.navigate('Invoices'),
          },
          {
            text: 'Send',
            onPress: () => {
              const whatsappUrl = `https://wa.me/91${customerMobile.replace(/\D/g, '')}?text=${encodeURIComponent(billMsg)}`;
              Linking.openURL(whatsappUrl);
              setProducts([]);
              setCustomerMobile('');
              setCustomerName('');
              navigation.getParent()?.navigate('Invoices');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Text style={styles.headerBackText}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Invoice</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
      <Text style={styles.label}>Customer Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter customer name"
        value={customerName}
        onChangeText={setCustomerName}
      />
      <Text style={styles.label}>Customer Mobile Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter mobile number"
        keyboardType="phone-pad"
        value={customerMobile}
        onChangeText={setCustomerMobile}
      />
      <Text style={styles.label}>Add Product</Text>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={productForm.name}
        onChangeText={v => setProductForm(f => ({ ...f, name: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={productForm.category}
        onChangeText={v => setProductForm(f => ({ ...f, category: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={productForm.price}
        onChangeText={v => setProductForm(f => ({ ...f, price: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        keyboardType="numeric"
        value={productForm.quantity}
        onChangeText={v => setProductForm(f => ({ ...f, quantity: v }))}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity style={[styles.scanBtn]} onPress={handleScan}>
          <Text style={styles.scanBtnText}>Scan Barcode</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn]} onPress={addProduct}>
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Products</Text>
      <FlatList
        data={products}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.productRow}>
            <Text style={{ flex: 2 }}>{item.name}</Text>
            <Text style={{ flex: 1 }}>{item.category}</Text>
            <Text style={{ flex: 1 }}>{item.quantity}</Text>
            <Text style={{ flex: 1 }}>{item.price}</Text>
            <Text style={{ flex: 1 }}>{item.value}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center' }}>No products added.</Text>}
      />
      <Text style={styles.label}>Mode of Payment</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {['Cash', 'Card', 'UPI'].map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.modeBtn, modeOfPayment === mode && styles.modeBtnSelected]}
            onPress={() => setModeOfPayment(mode)}
          >
            <Text style={modeOfPayment === mode ? styles.modeBtnTextSelected : styles.modeBtnText}>{mode}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Bill Preview</Text>
      <View style={styles.billBox}>
        <Text style={styles.billTitle}>{STORE_INFO.name}</Text>
        <Text>{STORE_INFO.address}</Text>
        <Text>Contact: {STORE_INFO.contact}</Text>
        <Text>Invoice No: {invoiceNo}</Text>
        <Text>Customer: {customerName} ({customerMobile})</Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>
        <View style={styles.billTableHeader}>
          <Text style={{ flex: 2 }}>Product</Text>
          <Text style={{ flex: 1 }}>Cat</Text>
          <Text style={{ flex: 1 }}>Qty</Text>
          <Text style={{ flex: 1 }}>Rate</Text>
          <Text style={{ flex: 1 }}>Value</Text>
        </View>
        {products.map((item, i) => (
          <View style={styles.billTableRow} key={i}>
            <Text style={{ flex: 2 }}>{item.name}</Text>
            <Text style={{ flex: 1 }}>{item.category}</Text>
            <Text style={{ flex: 1 }}>{item.quantity}</Text>
            <Text style={{ flex: 1 }}>{item.price}</Text>
            <Text style={{ flex: 1 }}>{item.value}</Text>
          </View>
        ))}
        <Text style={styles.billTotal}>Total: ₹{totalValue.toFixed(2)}</Text>
        <Text>Payment: {modeOfPayment}</Text>
      </View>
      <Button title={generating ? 'Generating...' : 'Generate & Send Invoice'} onPress={handleGenerate} disabled={generating} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#c7d9fcff',
    marginBottom: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: {
    fontSize: 28,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 44,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  scanBtn: {
    backgroundColor: '#ffb300',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  scanBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 6,
  },
  modeBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  modeBtnSelected: {
    backgroundColor: '#4f8cff',
  },
  modeBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  modeBtnTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  billBox: {
    backgroundColor: '#f7f8fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  billTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  billTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bbb',
    paddingVertical: 4,
    marginTop: 8,
  },
  billTableRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  billTotal: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'right',
  },
});

export default GenerateInvoiceScreen;
