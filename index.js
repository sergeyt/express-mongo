var mongoskin = require('mongoskin');

module.exports = function(app, options) {
  var db = options.db;
  if (!db) throw new Error("options.db connection is not specified");

  var prefix = options.prefix || '/docs';
  // list of document collections
  app.get(prefix, function(req, res) {
    // TODO send array of collections
  });

  var collection = function(req) {
    return db.collection(req.params.collection);
  };

  app.route(prefix + '/:collection')
    .get(function(req, res, next) {
      // TODO query, limit, sort
      collection(req).find({} ,{limit: 10, sort: {'_id': -1}}).toArray(function(err, docs){
        if (err) return next(err);
        res.send(docs);
      });
    })
    .post(function(req, res, next) {
      collection(req).insert(req.body, {}, function(err, result){
        if (err) return next(err);
        res.send(result);
      });
    })
    .delete(function(req, res, next) {
      // TODO remove by query selector
      res.send('not implemented!');
    });

  app.route(prefix + '/:collection/:id')
    .get(function(req, res, next) {
      var id = req.params.id;
      collection(req).findById(id, function(err, result){
        if (err) return next(err);
        res.send(result);
      });
    })
    .put(function(req, res, next) {
      var id = req.params.id;
      collection(req).updateById(id, {$set: req.body}, {safe: true, multi: false}, function(err, result){
        if (err) return next(err);
        res.send({_id: id});
      });
    })
    .delete(function(req, res, next) {
      var id = req.params.id;
      collection(req).removeById(id, function(err, result){
        if (err) return next(err);
        res.send({count: result});
      });
    });
};
