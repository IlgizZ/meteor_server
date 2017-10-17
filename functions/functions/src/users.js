var setUserRoutes = function(router){

  router.get('/users', function(req, res, next) {

    // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    //
    // // Request methods you wish to allow
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    //
    // // Request headers you wish to allow
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    //
    // // Set to true if you need the website to include cookies in the requests sent
    // // to the API (e.g. in case you use sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);
    var firebase = req.app.get('firebase');
    return firebase.database().ref('/users/').once('value').then(function(snapshot) {
      res.send({users: snapshot})
    });

  });

}

module.exports = setUserRoutes;
