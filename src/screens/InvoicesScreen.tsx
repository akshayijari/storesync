import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';


type Invoice = {
  id: string;
  createdAt: { seconds: number; nanoseconds: number };
  invoiceNo: string;
  customerMobile: string;
  totalValue: number;
  [key: string]: any;
};

type RootStackParamList = {
  GenerateInvoice: undefined;
};


const InvoicesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchInvoices = React.useCallback(async () => {
    setLoading(true);
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const q = query(collection(db, 'invoices'));
    const snap = await getDocs(q);
    const filtered = snap.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt,
          invoiceNo: data.invoiceNo,
          customerMobile: data.customerMobile,
          totalValue: data.totalValue,
          ...data,
        } as Invoice;
      })
      .filter(inv => inv.createdAt && inv.createdAt.seconds * 1000 >= twoDaysAgo);
    setInvoices(filtered.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInvoices();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchInvoices]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Recent Invoices</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('GenerateInvoice')}
        >
          <Ionicons name="add-circle" size={32} color="#4f8cff" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text>Loading...</Text>
      ) : null}
      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => { setSelectedInvoice(item); setModalVisible(true); }}>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceNo}>{item.invoiceNo}</Text>
              <Text>Customer: {item.customerName ? `${item.customerName} (${item.customerMobile})` : item.customerMobile}</Text>
              <Text>Total: ₹{item.totalValue}</Text>
              <Text>Date: {item.createdAt && new Date(item.createdAt.seconds * 1000).toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center' }}>No invoices in last 2 days.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '60%', maxHeight: '90%' }}>
            <ScrollView>
              {selectedInvoice && (
                <>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>Invoice Bill</Text>
                  <Text style={{ fontWeight: 'bold' }}>Invoice No: {selectedInvoice.invoiceNo}</Text>
                  <Text>Customer: {selectedInvoice.customerName ? `${selectedInvoice.customerName} (${selectedInvoice.customerMobile})` : selectedInvoice.customerMobile}</Text>
                  <Text>Date: {selectedInvoice.createdAt && new Date(selectedInvoice.createdAt.seconds * 1000).toLocaleString()}</Text>
                  <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Products:</Text>
                  {selectedInvoice.products && selectedInvoice.products.map((p: any, i: number) => (
                    <Text key={i} style={{ marginLeft: 8 }}>
                      {p.name} ({p.category}) x{p.quantity} @ ₹{p.price} = ₹{p.value}
                    </Text>
                  ))}
                  <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Total: ₹{selectedInvoice.totalValue}</Text>
                  <Text>Payment: {selectedInvoice.modeOfPayment}</Text>
                </>
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 16, alignSelf: 'center', backgroundColor: '#4f8cff', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceRow: {
    backgroundColor: '#f4f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceNo: {
    color: '#4f8cff',
    marginBottom: 2,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default InvoicesScreen;
