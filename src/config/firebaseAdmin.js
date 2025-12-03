// config/firebaseAdmin.js
const admin = require('firebase-admin');

const serviceAccount = {
  type: process.env.GCLOUD_TYPE,
  project_id: process.env.GCLOUD_PROJECT_ID,
  private_key_id: process.env.GCLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GCLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GCLOUD_CLIENT_EMAIL,
  client_id: process.env.GCLOUD_CLIENT_ID,
  auth_uri: process.env.GCLOUD_AUTH_URI,
  token_uri: process.env.GCLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GCLOUD_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GCLOUD_CLIENT_CERT_URL,
  universe_domain: process.env.GCLOUD_UNIVERSE_DOMAIN,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.GCLOUD_PROJECT_ID,
  });
}

module.exports = admin;
