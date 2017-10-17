var setPaymentsRoutes = function(router){

  router.get('/payments', function(req, res, next) {

    
    var firebase = req.app.get('firebase');
    return firebase.database().ref('/users/').once('value').then(function(snapshot) {
      res.send({users: snapshot})
    });

  });

}

module.exports = setPaymentsRoutes;
