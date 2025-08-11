// src/modules/auth/AuthContext.tsx
import React, { createContext, useState, ReactNode } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Adjust path if needed

// Define User type (consistent with your Redux store)
interface User {
  uid: string;
  email: string | null;
  role: 'admin' | 'employee' | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: 'admin' | 'employee') => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const role = userDoc.data()?.role as 'admin' | 'employee' | null; // Type assertion for safety
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role: role ?? null, // Fallback if role is missing
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw for handling in UI
    }
  };

  const signup = async (email: string, password: string, role: 'admin' | 'employee') => {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), { role });
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        role,
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier consumption (optional but recommended)
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider; // If needed for direct import
