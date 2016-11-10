'use strict';

// dependencies ===============================================================
var express       = require('express');
var cors          = require('cors');
var app           = express();
var morgan        = require('morgan');
var bodyParser    = require('body-parser')
var BoxSDK        = require('box-node-sdk');
var cookieParser  = require('cookie-parser');

// load configuration objects =================================================
var BoxConfig     = require('./config/box');

// configure app ==============================================================
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(morgan('dev')); // log every request to the console
var port       = process.env.PORT || 80;

// routes =====================================================================
require('./routes')(app);

// start the server ===========================================================
app.listen(port);
console.log('listening on port '+port);