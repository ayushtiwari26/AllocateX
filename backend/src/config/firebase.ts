import admin from 'firebase-admin';
import { config } from './index';

// Only initialize Firebase if credentials are provided
if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Firebase Admin:', error instanceof Error ? error.message : error);
  }
} else {
  console.warn('Firebase credentials not configured. Firebase features will be disabled.');
}

export default admin;
