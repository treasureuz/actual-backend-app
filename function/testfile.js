const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.onUserCreate = functions.auth.user().onCreate((user) => {
  const uid = user.uid;
  const email = user.email;

  return admin.firestore().collection('users').doc(uid).set({
    email: email
  });
});