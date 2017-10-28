const functions = require('firebase-functions');
var bodyParser = require('body-parser');
var moment = require('moment');
const admin = require('firebase-admin');

var cors = require('cors')({
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
})

var equal = require('deep-equal');
var defaultApp = admin.initializeApp(functions.config().firebase);
const dbRef = admin.database().ref();

require('./functions/src/function_category2.js')(exports);
require('./functions/src/payments.js')(exports);
require('./functions/src/auth.js')(exports);

exports.helloWorld = functions.https.onRequest((request, response) => {
  const method = request.method;
  const query = request.query;
  const body = request.body;

  if (checkTime()) {
    var error = {error: "we are not working:("}
    response.status(505).send(error);
    return;
  }

  response.status(200).send("\nHello!\nMethods: " + method
    + "\nQuery: " + query
    + "\nBody: " + body
  );
});

exports.checkOrder = functions.https.onRequest((request, response) => {
  cors(request, response, () => {


    const method = request.method;
    const query = request.query;
    const body = request.body;


    if (!isEmpty(query) || method == 'GET' || isEmpty(body)) {
      response.status(404).send("404 Not found :,(");
      return;
    }

    if (checkTime()) {
      var error = {error: "we are not working:("}
      response.status(202).send(error);
      return
    }

    var error = {error: "invalid data!"};
    var products = body.products
    var totalPrice = body.priceTotalCart
    var choosenGifts = body.choosenGifts
    var birthday = body.birthday
    var paymentType = body.paymentType
    var customer = body.user
    var meteors = body.meteors

    if (!products || isEmpty(products) || totalPrice <= 0
              || !choosenGifts || isEmpty(choosenGifts) || birthday == undefined
              || !paymentType || !customer || meteors < 0) {
      console.log("wrong input date");
      response.status(202).send(error);
      return;
    }

    checkProducts(products).then(checkedPrice => {
      console.log("Is birthday: " + birthday);
      if (birthday == true)
        checkedPrice = Math.round(checkedPrice * 0.75);
      var eps = 0.0000001;
      checkedPrice -= meteors;

      if (checkedPrice > 0 && Math.abs(checkedPrice - totalPrice) < eps) {
        console.log("Final total price is: " + checkedPrice);
        checkGifts(choosenGifts, totalPrice).then(equals => {
          if (equals) {
            console.log("Creating order.");
            var order = { products,
              totalPrice,
              choosenGifts,
              paymentType,
              customer
            };

            if (birthday)
              order["birthday"] = birthday;

            if (meteors > 0)
              order["meteors"] = meteors;

            makeOrder(order).then((key) => {
              if (paymentType == "cash") {
                response.status(200).send("\n Order created with key: " + key);
                return;
              } else {
                var transaction = {
                  "price": totalPrice,
                  "orderKey": key,
                  customer
                }
                doTransactions(transaction).then(() => {
                  response.status(200).send({ "message" : "Sending to payment system transaction", transaction });
                  return;
                });
              }
            }, err => {
              console.log(err);
              response.status(202).send(error);
              return
            });

          } else {
            console.log("invalid gifts");
            response.status(202).send(error);
            return
          }
        });
      } else {
        console.log("Prices doesn't match!");
        response.status(202).send(error);
      }
    });
  });
});

function checkTime() {
  var time = moment()
  const hours = time.format("HH");
  const minutes = time.format("mm");

  return false //(hours > 1 || hours < 2)
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}
function compareObjects(o1, o2) {
  return equal(o1, o2)
}

function checkProducts(products) {
  const productsToFetch = products.map(p => {return p.product_id});

  const productsPromise = productsToFetch.map((id, index) => {
    return dbRef.child('products').child(products[index].category).child(id).once('value').then( s => { return s.val() });
  });

  return Promise.all(productsPromise)
    .then(productsFromFirebase => {
      var totalPrice = 0;
      var equal = true;

      productsFromFirebase.map((p, index) => {
        if (!equal)
          return

        var product = products[index];
        if (product.toppings.length == 0)
          delete product.toppings
        var productPrice = 0;

        var infoFirebase = {"name": p.name, "decription": p.description, "img": p.description}
        var info = {"name": product.name, "decription": product.description, "img": product.description}
        console.log("-------------------------------//------------------------------------");

        console.log("Check the product");
        console.log(product);
        console.log("-------------------------------//------------------------------------");
        console.log("Comparing 2 infos, is equal: " + compareObjects(infoFirebase, info));
        console.log(infoFirebase);
        console.log(info);

        if (!compareObjects(infoFirebase,info)) {
          equal = false;
          return;
        }
        //check toppings
        if (product.toppings) {
          var productToppings = product.toppings;
          console.log("Toppings: ");
          console.log(productToppings);

          var firebaseToppings = Object.keys(p.toppings).map(key => {
            var topping = p.toppings[key];
            topping["id"] = key;
            return topping
          })

          productToppings.map(t => {
            if (!equal)
              return

            var topping = {"img": t.img, "name": t.name, "price": t.price, "weight": t.weight, "id": t.id};
            equal = false;

            firebaseToppings.map(firebaseTopping => {

              if (compareObjects(firebaseTopping, topping)) {
                equal = true;
                productPrice += t.price * t.count;
              }
            })
          })

          if(!equal)
            return
        }

        if (p.sizes) {
          equal = false;
          console.log("Size contains in firebase product");
          console.log(p.sizes);
          var s = {"price": product.price, "radius": product.radius, "weight": product.weight}
          console.log("comparing with size: ");
          console.log(s);

          var sizes = p.sizes.map(size => {
            if (compareObjects(s, size)) {
              equal = true;
              return size;
            }
          })
          .filter((size) => size != undefined)

          console.log("Is size found: " + equal);
          console.log("Sizes found count: " + sizes.length);
          console.log(sizes);

          if (sizes.length != 1) {
            equal = false;
          } else {
            productPrice += sizes[0].price;
          }
        } else {
          equal = p.weight == product.weight;
          productPrice += p.price;
        }

        console.log("Found equal: " + equal);

        if(!equal)
          return

        totalPrice += productPrice * product.quantity;
        console.log("For product \"" + product.name + "\" all ok, it's price is: " + productPrice);
      })

      console.log("-------------------------------//------------------------------------");
      console.log("Counted total price is (birthday check later): " + totalPrice);

      if (!equal)
        return -1;
      return totalPrice;
    })
    .catch(err => {
      console.log(err);
      return -1;
    })
}

function checkGifts(choosenGifts, totalPrice) {
  if (!choosenGifts || choosenGifts.length == 0)
    return new Promise((resolve, reject) => {
      resolve(true);
    });

  console.log(choosenGifts);
  return dbRef.child("products_for_promotion").once('value').then( (snapshot) => {
    var step = snapshot.val().step;
    var giftCount = Math.floor(totalPrice / step);

    if (giftCount < choosenGifts.length) {
      console.log("incorrect gifts count!");
      console.log("given: " + choosenGifts.length);
      console.log("expected no more than: " + giftCount);
      return false;
    }

    var equal = true;
    var productsObject = snapshot.val().gift_products;
    var products = Object.keys(productsObject).map(key => {
      var product = productsObject[key];
      product["id"] = key;
      return product;
    })

    for (var i = 0; i < choosenGifts.length; i++) {
      if (!equal)
        break;

      var found = false;

      for (var j = 0; j < products.length; j++) {
        if (compareObjects(choosenGifts[i], products[j])) {
          found = true;
          break;
        }
      }

      equal = found;
    }

    return equal;
  });
}

function doTransactions(transaction) {
  console.log("Created transaction: ");
  console.log(transaction);
  return new Promise((resolve, reject) => {
    resolve();
  });
}
function makeOrder(order) {
  var {customer} = order;
  order["status"] = "waiting for paying";

  var orderRef = dbRef.child("orders").push();
  var orderKey = orderRef.key;
  console.log(orderKey);
  return orderRef.set(order).then(() => {
    console.log("order created! Key: " + orderKey);

    if (customer != "anonim")
      return dbRef.child("users").child(customer).child("orders").child(orderKey).set(order).then(() => {return orderKey});

    return new Promise((resolve, reject) => {
      resolve(orderKey);
    });
  });
}
