'use client';

import { createContext, useContext, useState } from 'react';
import { User } from 'firebase/auth';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  return (
    <AuthContext.Provider value={{ user, setUser, isGuest, setIsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
