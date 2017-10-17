const functions = require('firebase-functions');
var bodyParser = require('body-parser');
var moment = require('moment');
var functions = require('firebase-functions');
const admin = require('firebase-admin');

var defaultApp = admin.initializeApp(functions.config().firebase)

const db = admin.database();

require('./functions/src/function_category2.js')(exports);

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
  const method = request.method;
  const query = request.query;
  const body = request.body;

  //TODO
  if (!(!isEmpty(query) || method == 'GET' || isEmpty(body))) {
    response.status(404).send("404 Not found :,(");
    return;
  }

  if (checkTime()) {
    var error = {error: "we are not working:("}
    response.status(505).send(error);
    return
  }

  var products = body.products
  var totalPrice = body.priceTotalCart
  var choosenGifts = body.choosenGifts

  if (!products || !totalPrice || totalPrice == 0) {
    var error = {error: "invalid data!"};
    response.status(505).send(error);
    return;
  }

  var checkedPrice = checkProducts(products)

  if (checkedPrice == totalPrice && checkGifts(choosenGifts, totalPrice)) {

  } else {
    var error = {error: "invalid data!"};
    response.status(505).send(error);
    return;
  }

  response.status(200).send("\n Allright! Order is valid!");
});

function checkTime() {
  var time = moment()
  const hours = time.format("HH");
  const minutes = time.format("mm");

  return (hours > 23 || hours < 2)
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}


function checkProducts(products) {
  const productsToFetch = products.map(p => return p.product_id);

  const productsPromise = productsToFetch.map((id, index) => {
    return databaseRef.child('products').child(products[index].category).child(id).on('value', s => s.val());
  });

  return Promise.all(productsPromise)
    .then(productsFromFirebase => {
      var totalPrice = 0;
      var equal = true;

      productsFromFirebase.map((p, index) => {
        if (!equal)
          return

        var product = products[index];
        var productPrice = 0;
        var infoFirebase = {name: p.name, decription: p.description, img: p.description}
        var info = {name: product.name, decription: product.description, img: product.description}

        if (info != infoFirebase) {
          equal = false;
          return;
        }
        //check toppings
        if (p.sizes) {
          equal = false;

          const sizes = p.sizes.map(size => {
            var s = {price: product.price, radius: product.radius, weigth: product.weight}

            if (size == s) {
              equal = true;
              return size;
            }
          })

          if (sizes.length != 1) {
            equal = false;
          } else {
            productPrice += sizes[0].price;
          }
        } else {
          equal = p.weight == product.weight;
          productPrice += p.price;
        }
      })

    })
    .catch(err => {
      // handle error
    })
}

function checkGifts(choosenGifts, totalPrice) {

}
