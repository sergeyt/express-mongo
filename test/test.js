var express = require('express');
var bodyParser = require('body-parser');
var mongoskin = require('mongoskin');
var api = require('../index.js');
var Q = require('q');
var should = require('should');
// TODO try supertest
var http = require('superagent');

var port = 9876;
var endpoint = 'http://localhost:' + port + '/docs/';
var collectionName = 'testusers';

describe('with express-mongo rest api I can', function() {
  var app;


  before(function() {
    var db = mongoskin.db('mongodb://@localhost:27017/test', {safe:true});
    db.collection(collectionName).remove({}, function(err, res) {
    });

    // TODO clean users collection

    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    api(app, {db: db});
    app.listen(port);
  });

  after(function() {
    // TODO it seems no need to stop app
  });

  it('POST, GET, PUT, DELETE object', function(done) {
    var users = collection(collectionName);
    var user = {name: 'bob'};

    users.add(user).then(function(docs) {
      docs.length.should.eql(1);
      docs[0]._id.length.should.eql(24);
      return users.get(docs[0]._id);
    }).then(function(doc) {
      var id = doc._id;
      delete doc._id;
      doc.should.eql(user);
      user.name = 'rob';
      return users.put(id, user);
    }).then(function(res) {
      return users.del(res._id);
    }).then(function(res) {
      res.count.should.eql(1);
      return users.fetch();
    }).then(function(docs) {
      docs.length.should.eql(0);
      return docs;
    }).catch(function(err) {
      should.fail(err);
      done();
    }).done(function(){
      done();
    });
  });
});

// helpers

function collection(name) {
  var url = endpoint + name;
  return {
    fetch: function() {
      console.log('GET %s', url);
      return promisify(http.get(url));
    },
    add: function(obj) {
      console.log('POST %s', url);
      return promisify(http.post(url).send(obj));
    },
    get: function(id) {
      console.log('GET %s/%s', url, id);
      return promisify(http.get(url + '/' + id));
    },
    put: function(id, obj) {
      console.log('PUT %s/%s', url, id);
      return promisify(http.put(url + '/' + id).send(obj));
    },
    del: function(id) {
      console.log('DELETE %s/%s', url, id);
      return promisify(http.del(url + '/' + id));
    }
  };
}

function promisify(req) {
  var d = Q.defer();
  req.end(function(err, res) {
    if (err) {
      d.reject(err);
    } else {
      d.resolve(res.body);
    }
  });
  return d.promise;
}
