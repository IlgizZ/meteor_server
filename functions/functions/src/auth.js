var signUp = function(router, firebase){

  router.post('/newReferral', function(req, res, next) {
    var firebase = req.app.get('firebase');
    const key = req.body.key;
    const parent = req.body.parent;
    var grany = null;
    const userRef = firebase.database().ref('/users/');

    return firebase.database().ref().child('users_count').once('value', snapshot => {
      var Hashids = require('hashids');
      var hashids = new Hashids("Meteor", 6);

      return hashids.encode(snapshot.val());
    })
    .then((referalCode) => {
      if (!parent) {
        return  userRef.child(key).update({ referalCode, meteors: 0 });
      } else {
        return userRef.child(key).update({
          parent_referal: parent,
          meteors: 1000,
          referalCode
        })
        .then(() => {
          userRef.orderByChild("referalCode").equalTo(parent).once('value', snapshot => {
            var value = snapshot.val();
            parent_key = Object.keys(value)[0];
            grany = value[parent_key].parent_referal;
            snapshot.ref.child(parent_key).once('value', snapshot => {
              var parentVal = snapshot.val();
              var meteors = parentVal.meteors || 0;
              meteors += 500;

              parentVal["meteors"] = meteors;
              parentVal.child_referals[key] = {level: "1"};
              return snapshot.ref.set(parentVal);
            })
            .then(() => {
              if (grany)
                return userRef.child(grany).once('value', snapshot => {
                  child("child_referals").child(parent_key)
                  var grany = snapshot.val();
                  var brothers = grany.child_referals[parent_key].childs || [];

                  brothers.push(key);
                  grany.child_referals[parent_key].childs = brothers;
                  grany.child_referals[parent_key].level = 1;

                  var meteors = grany.meteors || 0;
                  meteors += 250;
                  grany["meteors"] = meteors;

                  return snapshot.ref.set(grany);
                });
            })
          })
        })
      }
    })
  });
}

module.exports = signUp;
