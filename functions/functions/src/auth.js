var signUp = function(router, firebase){

  router.post('/newReferral', function(req, res, next) {
    var firebase = req.app.get('firebase');

    firebase.database().ref().child('users_count').once('value', snapshot => {
      var Hashids = require('hashids');
      var hashids = new Hashids("Meteor", 6);

      var referalCode = hashids.encode(snapshot.val());

      const key = req.body.key;
      const parent = req.body.parent;

      const userRef = firebase.database().ref('/users/');

      if (!parent) {
        userRef.child(key).update({
          referalCode
        });
      } else {
        userRef.child(key).update({
          parent_referal: parent,
          referalCode
        });

        userRef.orderByChild("referalCode").equalTo(parent).once('value', snapshot => {
          var value = snapshot.val();
          var parent_key = Object.keys(value)[0];

          snapshot.ref.child(parent_key).child("child_referals").child(key).set({
            level: "1"
          })
          var grany = value[parent_key].parent_referal;

          if (grany)
            userRef.child(grany).child("child_referals").child(parent_key).once('value', snapshot => {
              var brothers = snapshot.val().childs;
              if (!brothers)
                brothers = []

              brothers.push(key);

              snapshot.ref.set({
                childs: brothers,
                level: 1
              })
            });
        });
      }
    });
  });
}

module.exports = signUp;
