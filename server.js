// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express'); 		// call express
var app = express(); 				// define our app using express
var bodyParser = require('body-parser');
var nano = require('nano')(process.env.COUCH_URL ? "https://" + process.env.COUCH_ADMIN_USERNAME + ":" + process.env.COUCH_ADMIN_PASSWORD + "@" + process.env.COUCH_URL : 'http://localhost:5984');

var chance = new (require('chance'));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080; 		// set our port

var errorResponse = function (err, res) {
  res.status = err.statusCode;
  res.send(err);
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------

// on routes that end in /bears
// ----------------------------------------------------
router.route('/sessions')
  // create a bear (accessed at POST http://localhost:8080/api/bears)
  .post(function (req, res) {
    if (req.body.image_url) {
      var dbName = chance.word({syllables: 2}) + "-" + chance.word({syllables: 2}) + "-" + chance.word({syllables: 2});
      console.log(dbName);
      nano.db.create(dbName, function (err, body) {
        if (!err) {
          var database = nano.use(dbName);
          database.insert({ image_url: req.body.image_url, doc_type: 's' }, 'session', function (err, body, header) {
            if (err) {
              console.log('[' + dbName + '.insert] ', err.message);
              errorResponse(err, res);
              return;
            }
            res.json({"id": dbName, "image_url": req.body.image_url});
          });
        } else {
          errorResponse(err, res);
          return;
        }
      });
    } else {
      res.status(422);
      res.send("No image url");
      return;
    }
  });

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/sessions/:session_id')
  .get(function (req, res) {
    var database = nano.db.use(req.params.session_id);
    database.get('session', {}, function (err, body) {
      if (err) {
        errorResponse(err, res);
        return;
      } else {
        res.json(body);
      }
    });
  });
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
