  

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, setProducts, setInventoryLoading } from '../store/store';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector((state: RootState) => state.inventory);
  const [sales, setSales] = useState<{ total: number; count: number; last7: number } | null>(null);
  const [forecast, setForecast] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Inventory listener
  const fetchInventory = React.useCallback(() => {
    dispatch(setInventoryLoading(true));
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const productList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          quantity: Number(data.quantity),
          price: Number(data.price),
          expirationDate: data.expirationDate,
          category: data.category,
          barcode: data.barcode,
        };
      });
      dispatch(setProducts(productList));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = fetchInventory();
    return () => unsubscribe();
  }, [fetchInventory]);

  // Sales data
  const fetchSales = React.useCallback(async () => {
    const snap = await getDocs(collection(db, 'invoices'));
    let total = 0, count = 0, last7 = 0;
    const now = Date.now();
    snap.forEach(doc => {
      const data = doc.data();
      if (data.totalValue) {
        total += data.totalValue;
        count++;
        // Last 7 days
        if (data.createdAt && data.createdAt.seconds) {
          const created = data.createdAt.seconds * 1000;
          if (now - created < 7 * 24 * 60 * 60 * 1000) last7 += data.totalValue;
        }
      }
    });
    setSales({ total, count, last7 });
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    fetchSales();
    fetchInventory();
    setTimeout(() => setRefreshing(false), 800);
  }, [fetchSales, fetchInventory]);

  // Simple forecast: average daily sales * 30
  useEffect(() => {
    if (sales && sales.count > 0) {
      setForecast(Math.round((sales.total / sales.count) * 30));
    }
  }, [sales]);

  if (loading || !sales) return <Text>Loading...</Text>;

  const lowStock = products.filter((p: any) => p.quantity < 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.heading}>Admin Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sales Summary</Text>
        <Text>Total Sales: ₹{sales.total.toFixed(2)}</Text>
        <Text>Invoices: {sales.count}</Text>
        <Text>Sales (Last 7 days): ₹{sales.last7.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Inventory</Text>
        <Text>Total Products: {products.length}</Text>
        <Text>Low Stock (&lt;5): {lowStock.length}</Text>
        {lowStock.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ fontWeight: 'bold' }}>Low Stock Items:</Text>
            {lowStock.map((p: any) => (
              <Text key={p.id} style={{ color: '#d32f2f' }}>{p.name} (Qty: {p.quantity})</Text>
            ))}
          </View>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast</Text>
        <Text>Next 30 days (est.): ₹{forecast ?? 0}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    padding: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4f8cff',
  },
});

export default AdminDashboard;
