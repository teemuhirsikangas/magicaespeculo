var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	
	res.render('index'), { 
	};
});

router.get('/garagedoor', function (req, res, next) {
  	
  	res.render('garagedoor'), { 
    };
});

router.get('/weathermode', function (req, res, next) {
  	
  	res.render('weather'), { 
    };
});

module.exports = router;
