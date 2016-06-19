'use strict';

const port = process.env.PORT || '8080';
const hostname = process.env.HOSTNAME || null;
const url = process.env.VIRTUAL_HOST || 'localhost:' + port;
const dbhost = process.env.DBHOST || 'localhost';
const dbname = process.env.MONGO_DB_NAME || 'ourjson';
const protocol = process.env.HTTP_PROTOCOL || 'https';
const restify = require('restify');
const mongojs = require('mongojs');
const shortid = require('shortid');
const key = require('mongo-key-escape');
const spawn = require('child_process').spawn;

// Functions
function filterkeys(json) {
  const finalObj = (Array.isArray(json)) ? [] : {};
  if (Array.isArray(json)) {
    json.forEach(function filterKeysArrayForEach(item, index) {
      finalObj[index] = (typeof item === 'object' && json[index] !== null) ? filterkeys(item) : item;
    });
  } else {
    Object.keys(json).forEach(function filterKeysObjectForEach(item) {
      finalObj[key.escape(item)] = (typeof json[item] === 'object' && json[item] !== null) ? filterkeys(json[item]) : json[item];
    });
  }
  return finalObj;
}

function unfilterkeys(json) {
  const finalObj = (Array.isArray(json)) ? [] : {};
  if (Array.isArray(json)) {
    json.forEach(function unfilterKeysArrayForEach(item, index) {
      finalObj[index] = (typeof item === 'object' && json[index] !== null) ? unfilterkeys(item) : item;
    });
  } else {
    Object.keys(json).forEach(function unfilterKeysObjectForEach(item) {
      finalObj[key.unescape(item)] = (typeof json[item] === 'object' && json[item] !== null) ? unfilterkeys(json[item]) : json[item];
    });
  }
  return finalObj;
}

function filterKeys(req, res, next) {
  if (req.body) {
    if (req.is('json')) {
      req.origBody = req.body;
      req.body = filterkeys(req.body);
      next();
    } else {
      res.json(400, {
        status: 400,
        message: 'Bad Request Body',
        description: 'The request content type is not JSON',
      });
    }
  } else {
    res.json(400, {
      status: 400,
      message: 'Empty Request Body',
      description: 'You sent a POST request without a body',
    });
  }
}


const server = restify.createServer();
server.pre(restify.pre.sanitizePath());
server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.queryParser());

const db = mongojs(dbhost + '/' + dbname, ['bins']);

server.get('/', function serverGetRoot(req, res, next) {
  res.json(200, {
    status: 200,
    message: 'Welcome to OurJSON API v1.1.0',
    version: 1,
    description: 'This API emulates http://myjson.com/api',
  });
  next();
});
server.post('/bins', filterKeys, function postBucket(req, res, next) {
  // Generate ID
  const binId = shortid.generate();
  db.bins.save({
    binId: binId,
    json: req.body,
  }, function postBucketSaveCallback(err, doc) {
    if (err) {
      res.json(500, {
        status: 500,
        message: 'Internal Server Error',
        description: 'Your data was not saved',
      });
    } if (doc) {
      res.header('Bin-ID', binId);
      res.json(201, { uri: protocol + '://' + url + '/bins/' + binId });
    } else {
      res.json(500, {
        status: 500,
        message: 'Internal Server Error',
        description: 'Your data was not saved',
      });
    }
  });
  next();
});

server.get('/bins/:binId', function getBucketId(req, res, next) {
  const binId = req.params.binId;
  if (binId === '') {
    res.json(404, {
      status: 404,
      message: 'Not Found',
      description: 'There was no bin ID sent',
    });
  }
  db.bins.find().limit(1);
  db.bins.find({
    binId: binId,
  }, function getBucketIdCallback(err, doc) {
    if (err) {
      res.json(500, {
        status: 500,
        message: 'Internal Server Error',
        description: 'The server failed to retrieve that ID',
      });
    } if (doc.length > 0) {
      res.json(200, unfilterkeys(doc[0].json));
    } else if (doc.length === 0) {
      res.json(404, {
        status: 404,
        message: 'Not Found',
        description: 'We could not find a bin with the ID (' + binId + ') in our system',
      });
    }
  });
  next();
});

server.put('/bins/:binId', filterKeys, function putBucketId(req, res, next) {
  const binId = req.params.binId;
  if (binId === '') {
    res.json(404, {
      status: 404,
      message: 'Not Found',
      description: 'There was no bin ID sent',
    });
  }
  db.bins.update({
    binId: binId,
  }, {
    $set: {
      json: req.body,
    },
  }, function putBucketIdCallback(err, doc) {
    if (err) {
      res.json(500, {
        status: 500,
        message: 'Internal Server Error',
        description: 'The server failed to retrieve that ID',
      });
    } if (doc.n !== 1) {
      res.json(404, {
        status: 404,
        message: 'Not Found',
        description: 'We could not find a bin with the ID (' + binId + ') in our system',
      });
    } else {
      res.json(200, unfilterkeys(req.origBody));
    }
  });
  next();
});

server.del('/bins/:binId', function deleteBucketId(req, res, next) {
  const binId = req.params.binId;
  if (binId === '') {
    res.json(404, {
      status: 404,
      message: 'Not Found',
      description: 'There was no bin ID sent',
    });
  } else {
    db.bins.remove({
      binId: binId,
    }, {
      justOne: true,
    }, function deleteBucketIdCallback(err1, result) {
      if (err1 || result.ok !== 1) {
        res.json(500, {
          status: 500,
          message: 'Internal Server Error',
          description: 'The server failed to delete that ID',
        });
      } else if (result.n === 1) {
        res.json(200, {
          status: 200,
          message: 'Success',
          description: 'Bin (' + binId + ') has been deleted.'
        });
      } else if (result.n === 0) {
        res.json(404, {
          status: 404,
          message: 'Not Found',
          description: 'We could not find a bin with the ID (' + binId + ') in our system',
        });
      }
    });
  }
  next();
});

// Session export
server.post('/export', function exportFunction(req, res, next) {
  const format = req.query.format || 'json';
  const selectedIds = req.body;
  if (format === 'json') {
    const errArray = selectedIds;
    res.set('Content-Type', 'application/json');
    const retval = [];
    db.bins.find().limit(selectedIds.length);
    db.bins.find({ binId: { $in: selectedIds } }, { _id: 0 }, function getExportCallback(err, doc) {
      if (err) {
        res.json(500, {
          status: 500,
          message: 'Internal Server Error',
          description: 'The server failed to retrieve that information',
        });
      } if (doc.length <= selectedIds.length) {
        doc.forEach(function getExportArrayify(item) {
          retval.push(item);
          errArray.splice(errArray.indexOf(item.binId), 1);
        });
        if (errArray.length > 0) {
          res.json(200, {
            data: unfilterkeys(retval),
            err: errArray,
          });
        } else {
          res.json(200, {
            data: unfilterkeys(retval),
          });
        }
      } else if (doc.length === 0) {
        res.json(404, {
          status: 404,
          message: 'Not Found',
          description: `None of the Ids ${JSON.stringify(selectedIds)} were found.`,
        });
      } else {
        res.json(400, {
          status: 400,
          message: 'Malformed request',
          description: `Too many documents matching ${JSON.stringify(selectedIds)} were found.`,
        });
      }
    });
  } else if (format === 'mongoexport') {
    res.set('Content-Type', 'application/json');
    const mongoExport = spawn('mongoexport', [
      '--db', dbname, '--collection', 'bins',
      '--jsonArray', '--host', `${dbhost}:27017`,
      '--fields', 'binId,json',
      '--query', `'{ binId: { $in: ${JSON.stringify(selectedIds)} } }'`,
    ]).stdout.pipe(res);
  } else {
    res.json(400, {
      status: 400,
      message: 'Malformed request',
      description: `Too many documents matching ${JSON.stringify(selectedIds)} were found.`,
    });
  }
  next();
});

if (hostname) {
  server.listen(port, hostname);
  console.log('Server listening on ' + url);
} else {
  server.listen(port);
  console.log('Server listening on ' + url)
}
