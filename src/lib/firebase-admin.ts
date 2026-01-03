import admin from "firebase-admin";

// Initialize Firebase Admin SDK
// Service account key should be stored in environment variable as JSON string
if (!admin.apps.length) {
    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (serviceAccountKey) {
            const serviceAccount = JSON.parse(serviceAccountKey);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("Firebase Admin initialized successfully");
        } else {
            console.log("FIREBASE_SERVICE_ACCOUNT_KEY not configured, FCM will be disabled");
        }
    } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
    }
}

export const firebaseAdmin = admin;

/**
 * Check if Firebase Admin is properly initialized
 */
export function isFirebaseAdminInitialized(): boolean {
    return admin.apps.length > 0;
}
