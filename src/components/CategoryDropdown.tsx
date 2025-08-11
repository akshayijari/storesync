import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface CategoryDropdownProps {
  value: string;
  onChange: (cat: string) => void;
  label?: string;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({ value, onChange, label }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'category', 'categories');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCategories(docSnap.data()["categories-list"] || []);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ marginBottom: 4, fontWeight: 'bold' }}>{label}</Text>}
      <TouchableOpacity style={styles.dropdown} onPress={() => setModalVisible(true)}>
        <Text style={{ color: value ? '#222' : '#888' }}>{value || 'Select Category'}</Text>
        <Ionicons name="chevron-down" size={20} color="#888" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Select Category</Text>
            {loading ? <ActivityIndicator size="large" color="#4f8cff" /> : (
              <FlatList
                data={categories}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.item} onPress={() => { onChange(item); setModalVisible(false); }}>
                    <Text style={styles.itemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}><Text>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, backgroundColor: '#f9f9f9', justifyContent: 'space-between' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16, color: '#222' },
  closeBtn: { marginTop: 16, alignSelf: 'center', padding: 10, borderRadius: 6, backgroundColor: '#eaeaea', minWidth: 80, alignItems: 'center' },
});

export default CategoryDropdown;
