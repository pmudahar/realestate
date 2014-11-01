'use strict';

var express = require('express');
var controller = require('./data.controller');

var router = express.Router();

router.post('/yelp', controller.yelp);
router.post('/sentiment', controller.sentiment);
router.post('/getYelp', controller.getYelp);

module.exports = router;