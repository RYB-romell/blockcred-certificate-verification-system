// backend/firebaseAdmin.js

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const normalizePrivateKey = (key = "") => {
  return key.replace(/\\n/g, "\n").trim();
};

const getFirebaseCredential = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);

      return admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: normalizePrivateKey(serviceAccount.private_key),
      });
    } catch (error) {
      throw new Error(
        `Invalid FIREBASE_SERVICE_ACCOUNT JSON in backend .env: ${error.message}`
      );
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || "");

  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID in backend .env");
  }

  if (!clientEmail) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL in backend .env");
  }

  if (!privateKey) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY in backend .env");
  }

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "Invalid FIREBASE_PRIVATE_KEY format. Make sure newline characters are stored as \\n in your .env file."
    );
  }

  return admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  });
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getFirebaseCredential(),
  });
}

export default admin;