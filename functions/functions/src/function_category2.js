var functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.database();

module.exports = function (e) {
    e.request2 = functions.https.onRequest((request, response) => {
      console.log(db);
      return db.ref().child("locations").once('value', snapshot => {
        response.send(snapshot.val());
      });
    })
};
