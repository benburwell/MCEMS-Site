
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , http = require('http')
  , path = require('path');

var app = express();

// Database things
var Schema = mongoose.Schema;
var Shift = new Schema({
	start: Date,
	end: Date,
	member: {
		name: String,
		rideStatus: String
	}
});

mongoose.model('Shift', Shift);
mongoose.connect('mongodb://localhost/mcems');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function (req, res) {
	res.render('index');
});

// schedule
app.get('/schedule', function (req, res) {
	res.redirect('/schedule/month');
});

app.get('/schedule/month', function (req, res) {

	var Shift = mongoose.model('Shift');

	Shift.find(function (err, shifts, count) {

		if (err) {
			res.send(500, 'Error retriving shifts');
			return;
		}

		res.render('schedule/monthly', {shifts: shifts});
	})
});

app.get('/schedule/add-shift', function (req, res) {
	res.render('schedule/addShiftForm');
});

app.post('/schedule/add-shift', function (req, res) {

	var Shift = mongoose.model('Shift');

	new Shift({
		start: req.body.start,
		end: req.body.end,
		member: {
			name: req.body.name,
			rideStatus: req.body.rideStatus
		}
	}).save(function (err, shift, count) {
		res.redirect('/schedule');
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
