var express = require("express");
// var mongoskin = require("mongoskin");

module.exports = function(options) {
  var prefix = options.prefix || "/api";
  var router = express.Router();

  function db(req) {
    // TODO wrap native db if not wrapped
    return req.db || options.db;
  }

  // list of document collections
  router.get(prefix + "/_collections", function(req, res, next) {
    db(req).collections(function(err, collections) {
      if (err) return next(err);
      var arr = collections
        // .filter(function(c) {
        //   return c.db && c.db.databaseName == dbname;
        // })
        .map(function(c) {
          return c.collectionName;
        });
      res.send(arr);
    });
  });

  var collection = function(req) {
    return db(req).collection(req.params.collection);
  };

  // collection handlers
  router
    .route(prefix + "/:collection")
    .get(function(req, res, next) {
      var query = req.query.query || {};
      if (typeof query == "string") {
        query = JSON.parse(query);
      }
      var limit = req.query.limit || 1000;
      // TODO sort from req.query
      collection(req)
        .find(query, { limit: limit, sort: { _id: -1 } })
        .toArray(function(err, docs) {
          if (err) return next(err);
          res.send(docs);
        });
    })
    .post(function(req, res, next) {
      collection(req).insert(req.body, {}, function(err, result) {
        if (err) return next(err);
        res.send(result);
      });
    })
    .delete(function(req, res, next) {
      var query = req.body.query;
      if (!query) {
        query = req.query.query || {};
        if (typeof query == "string") {
          query = JSON.parse(query);
        }
      }
      collection(req).remove(query, function(err, result) {
        if (err) return next(err);
        res.send({ count: result });
      });
    });

  router.get(prefix + "/:collection/count", function(req, res, next) {
    collection(req).count(function(err, result) {
      if (err) return next(err);
      res.send({ count: result });
    });
  });

  // document handlers
  router
    .route(prefix + "/:collection/:id")
    .get(function(req, res, next) {
      var id = req.params.id;
      collection(req).findById(id, function(err, result) {
        if (err) return next(err);
        res.send(result);
      });
    })
    .put(function(req, res, next) {
      var id = req.params.id;
      collection(req).updateById(
        id,
        { $set: req.body },
        { safe: true, multi: false },
        function(err) {
          if (err) return next(err);
          res.send({ _id: id });
        }
      );
    })
    .delete(function(req, res, next) {
      var id = req.params.id;
      collection(req).removeById(id, function(err, result) {
        if (err) return next(err);
        res.send({ count: result });
      });
    });

  return router;
};
