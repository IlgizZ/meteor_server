var functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.database();

//newReferral({parent: "Some_key"})
//

// e.newReferral = functions.database.ref('/users/{pushId}/email_verified').onUpdate( user => {
//
//     console.log("Creted new user with uid: " + user.params.pushId);
//     const originalUser = user.data.val();
//     console.log("User data: ");
//     console.log(originalUser);
//
//     const key = user.params.pushId;
//     const parent = originalUser.parent;
//     var parentKey = null;
//     // var grany = null;
//     const userRef = db.ref('/users/');
//     var meteorsReferalCount = 500;
//
//     return db.ref().child('users_count').once('value', snapshot => {
//       var Hashids = require('hashids');
//       var hashids = new Hashids("Meteor", 6);
//       var usersCount = snapshot.val() + 1;
//
//       return snapshot.ref.set(usersCount).then(() => {
//         return hashids.encode(usersCount - 1);
//       }).then((referalCode) => {
//         var meteors = parent ? meteorsReferalCount : 0;
//
//           if (!parent) {
//             return userRef.child(key).update({
//               unconfirmed_meteors: meteors,
//               referalCode
//             })
//           } else {
//             return userRef.orderByChild("referal_code").equalTo(parent).once('value', snapshot => {
//               var parentValue = snapshot.val();
//               if (parentValue == undefined) {
//                 console.warn("Cannot find parent of: " + key + "!\n Parent ref: " + parent);
//                 return;
//               }
//
//               parentKey = Object.keys(parentValue)[0];
//               grany = parentValue[parentKey].parent;
//
//               if (parentValue.email_verified == false && parentValue.phone_verified == false){
//                 console.warn("User with key: " + key + " has not verified parent! Parent key: " + parentKey);
//                 return userRef.child(key).update({
//                   unconfirmed_meteors: meteors,
//                   referalCode,
//                   hacker: true
//                 })
//               }
//
//               console.log("Add to parent with key(" + parentKey + ") " + meteorsReferalCount + " additional meteors for referal " + key);
//
//               return userRef.child(key).update({
//                 parent: parentKey,
//                 unconfirmed_meteors: meteors,
//                 referalCode
//               }).then(() => {
//
//                 return snapshot.ref.child(parentKey).once('value', snapshot => {
//                   var parentVal = snapshot.val();
//                   var unconfirmed_meteors = parentVal.unconfirmed_meteors || 0;
//                   unconfirmed_meteors += meteorsReferalCount;
//
//                   parentVal["unconfirmed_meteors"] = unconfirmed_meteors;
//                   parentVal.child_referals = parentVal.child_referals || {}
//                   parentVal.child_referals[key] = {level: "1"};
//                   return snapshot.ref.set(parentVal);
//                 })
//                 .then(() => {
//                   if (grany)
//                     return userRef.child(grany).once('value', snapshot => {
//                       var granyValue = snapshot.val();
//                       if (granyValue == undefined) {
//                         console.warn("Cannot find grany of:" + key + "\n Grany: " + grany);
//                         return;
//                       }
//
//                       var brothers = granyValue.child_referals[parentKey].childs || [];
//
//                       brothers.push(key);
//                       granyValue.child_referals[parentKey].childs = brothers;
//                       granyValue.child_referals[parentKey].level = 1;
//
//                       var meteors = granyValue.meteors || 0;
//                       meteors += meteorsReferalCount / 2;
//                       granyValue["meteors"] = meteors;
//                       console.log("Add to parent with key(" + grany + ") " + meteorsReferalCount / 2 + " additional meteors for referal " + key);
//
//                       return snapshot.ref.set(granyValue);
//                     });
//                 })
//               })
//             })
//           }
//
//       })
//     })
//   });
//newReferral({parent: "bmxRjd"})
function meteorVerification(key, parent) {
  const userRef = db.ref('/users/');
  var meteorsReferalCount = 500;

  return db.ref().child('users_count').once('value', snapshot => {
    var Hashids = require('hashids');
    var hashids = new Hashids("Meteor", 6);
    var usersCount = snapshot.val() + 1;

    return snapshot.ref.set(usersCount).then(() => {
      return hashids.encode(usersCount - 1);
    }).then((referalCode) => {
      var meteors = parent ? meteorsReferalCount : 0;

      if (!parent) {
        return userRef.child(key).update({
          unconfirmed_meteors: 0,
          meteors,
          referalCode
        })
      } else {
        return userRef.orderByChild("referal_code").equalTo(parent).once('value', snapshot => {
          var parentValue = snapshot.val();
          if (parentValue == undefined) {
            console.warn("Cannot find parent of: " + key + "!\n Parent ref: " + parent);
            return;
          }

          var parentKey = Object.keys(parentValue)[0];

          return userRef.child(key).update({
            parent: parentKey,
            unconfirmed_meteors: 0,
            meteors,
            referalCode
          }).then(() => {
            console.log("Add to parent with key(" + parentKey + ") " + meteorsReferalCount + " additional meteors for referal " + key);

            return snapshot.ref.child(parentKey).once('value', snapshot => {
              var parentVal = snapshot.val();

              parentVal.unconfirmed_meteors = parentVal.unconfirmed_meteors || 0;
              parentVal.unconfirmed_meteors -= meteorsReferalCount;

              parentVal.meteors = parentVal.meteors || 0;
              parentVal.meteors += meteorsReferalCount;

              return snapshot.ref.set(parentVal);
            })
          })
        })
      }
    })
  })
}
module.exports = function (e) {
  e.emailVerifiedListener = functions.database.ref('/users/{pushId}/email_verified').onUpdate( user => {
      console.log("sdfsd");
      const key = user.params.pushId;
      console.log("Email was verified by user with uid: " + key);
      const originalUser = user.data.val();
      console.log("User data: ");
      console.log(originalUser);

      if (originalUser.phone_verified == true) {
        console.log("User already verified by phone!");
        return;
      }

      const parent = originalUser.parent;

      meteorVerification(key, parent);
    });

    e.phoneVerifiedListener = functions.database.ref('/users/{pushId}/phone_verified').onUpdate( user => {

        const key = user.params.pushId;
        console.log("Email was verified by user with uid: " + key);
        const originalUser = user.data.val();
        console.log("User data: ");
        console.log(originalUser);

        if (originalUser.phone_verified == true) {
          console.log("User already verified by phone!");
          return;
        }

        const parent = originalUser.parent;

        meteorVerification(key, parent);
      });

    e.newReferral = functions.database.ref('/users/{pushId}').onCreate( user => {
      const key = user.params.pushId;
      console.log("Creted new user with uid: " + key);

      const originalUser = user.data.val();
      console.log("User data: ");
      console.log(originalUser);

      const parent = originalUser.parent;

      const userRef = db.ref('/users/');
      var meteorsReferalCount = 500;

      var meteors = parent ? meteorsReferalCount : 0;

        if (!parent) {
          return userRef.child(key).update({
            unconfirmed_meteors: meteors
          })
        } else {
          return userRef.orderByChild("referal_code").equalTo(parent).once('value', snapshot => {
            var parentValue = snapshot.val();
            if (parentValue == undefined) {
              console.warn("Cannot find parent of: " + key + "!\n Parent ref: " + parent);
              return;
            }

            var parentKey = Object.keys(parentValue)[0];

            return userRef.child(key).update({
              parent: parentKey,
              unconfirmed_meteors: meteors
            }).then(() => {
              console.log("Add to parent with key(" + parentKey + ") " + meteorsReferalCount + " additional meteors for referal " + key);
              return snapshot.ref.child(parentKey).once('value', snapshot => {
                var parentVal = snapshot.val();

                parentVal.unconfirmed_meteors = parentVal.unconfirmed_meteors || 0;
                parentVal.unconfirmed_meteors += meteorsReferalCount;

                parentVal.child_referals = parentVal.child_referals || {}
                parentVal.child_referals[key] = {level: "1"};

                return snapshot.ref.set(parentVal);
              })
            })
          })
        }
    });
}
