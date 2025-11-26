// check-claims.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // ajusta si tu nombre es otro

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const uid = process.argv[2];
if (!uid) { console.error('Usage: node check-claims.js <UID>'); process.exit(1); }

admin.auth().getUser(uid)
  .then(u => {
    console.log('UID:', u.uid);
    console.log('Email:', u.email);
    console.log('Custom claims:', u.customClaims);
  })
  .catch(err => {
    console.error('Error:', err);
  });
