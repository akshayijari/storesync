import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  onSelect: (selected: string[]) => void;
}

const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({ visible, onClose, selected, onSelect }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<string[]>(selected);

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
    if (visible) fetchCategories();
  }, [visible]);

  useEffect(() => {
    setChecked(selected);
  }, [selected, visible]);

  const toggle = (cat: string) => {
    setChecked(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleApply = () => {
    onSelect(checked);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Categories</Text>
          {loading ? <ActivityIndicator size="large" color="#4f8cff" /> : (
            <FlatList
              data={categories}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => toggle(item)}>
                  <Ionicons name={checked.includes(item) ? 'checkbox' : 'square-outline'} size={24} color="#4f8cff" />
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn}><Text>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.actionBtn}><Text>Apply</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemText: { marginLeft: 12, fontSize: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 16 },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8 },
});

export default CategoryFilterModal;
