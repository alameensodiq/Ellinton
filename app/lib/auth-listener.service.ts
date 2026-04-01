import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase'; 
import { store } from '../lib/store';
import { setCredentials, logout } from '../lib/slices/authSlice';
import { registerDeviceWithBackend } from './notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthListenerService {
  private unsubscribe: (() => void) | null = null;

  startListening() {
    if (this.unsubscribe) return;

     console.log('👂 AuthListener: Starting to listen to Firebase auth state');

    this.unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          console.log('🔥 Firebase user detected:', firebaseUser.email);
          
          const firebaseToken = await firebaseUser.getIdToken();
          const appToken = await AsyncStorage.getItem('authToken');
          
          // Get current state to preserve existing user data
          const currentState = store.getState() as any;
          const existingUser = currentState.auth?.user || {};
          
          // Merge Firebase data with existing user data
          store.dispatch(setCredentials({
            user: {
              ...existingUser, // Preserve existing app user data
              id: firebaseUser.uid,
              email: firebaseUser.email || existingUser.email || '',
              email_verified: firebaseUser.emailVerified,
              firebaseUid: firebaseUser.uid,
              firebaseUser: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              }
            },
            token: appToken || '', // Your app token
            isAuthenticated: !!appToken, // Only true if app token exists
          }));

          await AsyncStorage.setItem('firebaseToken', firebaseToken);

          console.log('✅ Firebase user synced with Redux');
        } else {
          console.log('👋 Firebase user signed out');
          
          await AsyncStorage.removeItem('firebaseToken');
          
          // Update user to remove Firebase data but keep app user
          const currentState = store.getState() as any;
          const existingUser = currentState.auth?.user;
          const appToken = currentState.auth?.token;
          
          if (existingUser && appToken) {
            // User is still logged into your app, just remove Firebase data
            const { firebaseUid, firebaseUser, ...userWithoutFirebase } = existingUser;
            
            store.dispatch(setCredentials({
              user: userWithoutFirebase,
              token: appToken,
              isAuthenticated: true,
            }));
          }
          // If no app token, do nothing - let your app handle logout
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      }
    });
  }

  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export default new AuthListenerService();