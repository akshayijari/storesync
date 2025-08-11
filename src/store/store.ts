// src/store/store.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Interface for a product in inventory
interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  expirationDate: string; // Use ISO string or Date format as needed
  category: string;
  barcode?: string;
}

interface InventoryState {
  products: Product[];
  loading: boolean;
}

interface User {
  uid: string;
  email: string;
  role: 'admin' | 'employee';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialInventoryState: InventoryState = {
  products: [],
  loading: false,
};

const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

// Inventory Slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState: initialInventoryState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.products = action.payload;
      state.loading = false;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.products.push(action.payload);
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeProduct(state, action: PayloadAction<string>) {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

// Export actions for easy dispatching
export const {
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  setLoading: setInventoryLoading,
} = inventorySlice.actions;

export const {
  setUser,
  setLoading: setAuthLoading,
  setError,
} = authSlice.actions;

// Configure and export the store
const store = configureStore({
  reducer: {
    inventory: inventorySlice.reducer,
    auth: authSlice.reducer,
    // Add more reducers here for future slices (e.g., analytics)
  },
});

// Export types for useSelector and useDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
