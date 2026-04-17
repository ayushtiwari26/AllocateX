# Firebase Setup for AllocateX Backend

## Getting Firebase Admin SDK Credentials

The web config you have is for **client-side** Firebase applications. For the backend (Node.js server), you need the **Firebase Admin SDK** service account credentials.

### Steps to Get Service Account Key:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/allocatex-80ac1/settings/serviceaccounts/adminsdk

2. **Generate New Private Key**
   - Click on "Service accounts" tab
   - Click "Generate new private key" button
   - Download the JSON file

3. **Update .env File**
   
   The downloaded JSON will look like this:
   ```json
   {
     "type": "service_account",
     "project_id": "allocatex-80ac1",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@allocatex-80ac1.iam.gserviceaccount.com",
     ...
   }
   ```

4. **Extract These Values to .env**:
   ```env
   FIREBASE_PROJECT_ID=allocatex-80ac1
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@allocatex-80ac1.iam.gserviceaccount.com
   ```

   **Important**: Keep the quotes around `FIREBASE_PRIVATE_KEY` and make sure the `\n` characters are preserved.

## Current Web Config (For Frontend Only)

The configuration you provided should be used in your **frontend/web application**:

```javascript
// Frontend Firebase Config (React/Vue/Angular)
const firebaseConfig = {
  apiKey: "AIzaSyAI1LJWNLB_kVF0m17J2ENRjxoD-bfhor0",
  authDomain: "allocatex-80ac1.firebaseapp.com",
  projectId: "allocatex-80ac1",
  storageBucket: "allocatex-80ac1.firebasestorage.app",
  messagingSenderId: "1073943243934",
  appId: "1:1073943243934:web:d4459396203d9e556cdf8f",
  measurementId: "G-9C6ZZ4JG1D"
};
```

## Backend vs Frontend Authentication Flow

### Backend (Admin SDK):
- Used for server-side operations
- Can create users, verify tokens, manage database
- Requires service account key
- Has full admin privileges

### Frontend (Web SDK):
- Used for client-side authentication
- Users sign in with email/password, Google, etc.
- Generates JWT tokens
- Limited to user operations

## Testing Without Firebase

The backend will run without Firebase credentials. Firebase features will be disabled, and you can still test:
- Database operations
- API endpoints (without authentication)
- CRUD operations

To enable full authentication, you must add the service account credentials.
