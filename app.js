'use strict';

const url = process.env.VIRTUAL_HOST || 'localhost:8080';
const dbhost = 'mongo';
const dbname = process.env.MONGO_DB_NAME || 'myjson';
const restify = require('restify');
const mongojs = require('mongojs');
const shortid = require('shortid');
const key = require('mongo-key-escape');

// Functions
function filterKeys(req, res, next) {
  if (req.body) {
    req.origBody = req.body;
    req.body = filterkeys(req.body);
  next();
  }
}

function filterkeys(json) {
  let finalObj = {};
  Object.keys(json).forEach(function(item) {
    if (typeof json[item] === 'object') {
      finalObj[key.escape(item)] = filterkeys(json[item]);
    } else {
    finalObj[key.escape(item)] = json[item];
    }
  });
  return finalObj;
}

function unfilterkeys(json) {
  let finalObj = {};
  Object.keys(json).forEach(function(item){
    if (typeof json[item] === 'object'){
      finalObj[key.unescape(item)] = unfilterkeys(json[item]);
    } else {
      finalObj[key.unescape(item)] = json[item];
    }
  });
  return finalObj;
}


const server = restify.createServer();
server.use(restify.CORS());
server.use(restify.bodyParser({ mapParams: false }));

const db = mongojs(dbhost + '/' + dbname, ['bins']);


server.post('/bins', filterKeys, function(req, res, next){
  // Generate ID
  const binId = shortid.generate();
  db.bins.save({
    binId: binId,
    json: req.body,
  }, function(err, success){
    if (err) {
      res.json(500, {
        status: 500,
        message: 'Internal Server Error',
        description: 'Your data was not saved.',
      });
      console.log(err);
    } else {
      res.json(201, {uri: 'http://' + url + '/bins/' + binId});
      console.log(success);
    }
  });
  next();
});

server.get('/bins/:binId', function(req, res, next){
  const binId = req.params.binId;
  db.bins.findOne({
    binId: binId
  }, function(err, doc){
    if (err) {
      res.json(404, {
        status: 404,
        message: 'Not Found',
        Description: 'We could not find a bin with that ID in our system',
      });
      console.log(err);
    } else {
      res.json(200, unfilterkeys(doc.json));
    }
  });
  next();
});

server.put('/bins/:binId', filterKeys, function(req, res, next) {
  const binId = req.params.binId;
  db.bins.update({
    binId: binId
  }, {
    $set: {
      json: req.body,
    },
  }, function(err, doc) {
    if (err) {
      res.json(404, {
        status: 404,
        message: 'Not Found',
        Description: 'We could not find a bin with that ID in our system',
      });
      console.log(err);
    } else {
      res.json(200, unfilterkeys(req.origBody));
    }
  });
  next();
});

server.listen(80);
