import { app, auth } from '../firebase';


class FirebaseService {
  async initialize(): Promise<boolean> {
    try {
      // Check if Firebase is already initialized
      if (app && auth) {
        console.log('✅ Firebase initialized successfully');
        
        // Initialize notifications after Firebase
        // await notificationService.initialize();
        
        return true;
      } else {
        console.error('❌ Firebase failed to initialize');
        return false;
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }

  getAuth() {
    return auth;
  }

  getApp() {
    return app;
  }
}

export default new FirebaseService();