var functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.database();

module.exports = function (e) {
    e.paymentCallback = functions.https.onRequest((request, response) => {
      const method = request.method;
      const query = request.query;
      const body = request.body;
      const order_id = query.order_id

      console.log("The query's body: ");
      console.log(query);

      if (!order_id) {
        console.log("Wrong order confirmation input!");
        response.status(505).send();
        return
      }

      if (method == "GET") {
         processPayment(order_id, response);
      } else {
        console.log("Error: GET request");
        response.status(404).send();
      }
    })
};

function processPayment(orderId, response) {

  return db.ref().child("coefficients").once('value', snapshot => {
    coefficients = snapshot.val();

    return db.ref().child("orders").child(orderId).once('value', snapshot => {
      var order = snapshot.val();

      if (!order) {
        console.log("Error: Incorrect order id");
        response.status(500).send();
        return;
      }

      if (order.status == "payed"){
        console.log("Error: Duplicate confirmation");
        response.status(500).send();
        return {error: "true"};
      }

      var payment = order.totalPrice;

      if (order.meteors)
        payment -= order.meteors;

      var meteors = Math.round(payment * coefficients.meteor);
      let userId = order.customer;

      return db.ref().child("users").child(userId).once('value').then(snapshot => {
          let user = snapshot.val();
          let parent = user.parent;

          var currentMeteors = user.meteors || 0;
          currentMeteors += meteors;

          return snapshot.ref.child("meteors").set(currentMeteors).then(() => {
            console.log(meteors + " meteors added to user with id: " + userId);
            return db.ref().child("orders").child(orderId).child("status").set("payed").then(() => {
              if (!parent){
                response.status(200).send();
                console.log("Order with id:");
                console.log(orderId);
                console.log(" is confirmed!");
                return
              }

              return db.ref().child("users").child(parent).child("meteors").once('value', snapshot =>{
                var parentMeteors = snapshot.val() || 0;
                additionalParentMeteors = Math.round(meteors * coefficients.referal);
                parentMeteors += additionalParentMeteors;

                return snapshot.ref.set(parentMeteors).then(() => {
                  console.log(additionalParentMeteors + " meteors added to user's parent with id: " + parent);
                  console.log("Order with id:");
                  console.log(orderId);
                  console.log(" is confirmed!");
                  response.status(200).send();
                });
              })
            })
          });
        })
    })
  })


}
