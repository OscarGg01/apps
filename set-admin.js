// set-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = process.argv[2]; // ejecutar: node set-admin.js UID_DEL_USUARIO

if (!uid) {
  console.error('Pon el uid como argumento: node set-admin.js UID');
  process.exit(1);
}

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log('Usuario marcado como admin');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
