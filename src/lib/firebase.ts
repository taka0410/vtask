// src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const ENV = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (process.env.NODE_ENV !== 'production') {
  console.log('[ENV CHECK]', {
    hasKey: !!ENV.apiKey,
    authDomain: ENV.authDomain,
  });
}

const firebaseConfig = {
  apiKey: ENV.apiKey!,
  authDomain: ENV.authDomain!,
  projectId: ENV.projectId!,
  storageBucket: ENV.storageBucket!, // 例: vtask.appspot.com
  messagingSenderId: ENV.messagingSenderId!,
  appId: ENV.appId!,
};

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Auth 初期化（Next.js で安全）
let auth: Auth;
try {
  auth = getAuth(app);
  // @ts-ignore
  if (!auth._initializationPromise) throw new Error('re-init');
} catch {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
}
export { auth };

export const db: Firestore = getFirestore(app);

// env 不足の警告（起動は続行）
if (!ENV.apiKey) {
  console.warn(
    '[ENV WARNING] NEXT_PUBLIC_FIREBASE_API_KEY is missing. Check .env.local and restart dev server.'
  );
}
