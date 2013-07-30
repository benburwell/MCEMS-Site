
/**
 * Module dependencies.
 */

var express = require('express'),
	mongoose = require('mongoose'),
	http = require('http'),
	path = require('path'),
	postmark = require('postmark')(process.env.POSTMARK_API_KEY),
	crypto = require('crypto'),

	// models for mongoose
	models = require('./models'),

	// pepper for passwords
	pepper = require('./pepper'),

	// routes
	jsonFeed = require('./routes/json'),
	member = require('./routes/member'),
	events = require('./routes/events'),
	schedule = require('./routes/schedule');

var app = express();

// database things
var Schema = mongoose.Schema;

// create models
mongoose.model('Shift', new Schema(models.shift));
mongoose.model('Member', new Schema(models.member));
mongoose.model('Event', new Schema(models.event));
mongoose.model('System', new Schema(models.system));

// connect to db
var uristring = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/mcems';
mongoose.connect(uristring);

// put mongoose in modules
member._connect(mongoose, postmark);
schedule._connect(mongoose, postmark);
jsonFeed._connect(mongoose, postmark);
events._connect(mongoose, postmark);

// all environments
app.set('port', process.env.PORT || 3000);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.session({secret: 'ahsdjkfhkjashdkfhaksdf'}));
app.use(function (req, res, next) {
	res.locals.authMember = req.session.member;
	next();
});
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function (req, res) {
	res.render('index', {member: req.session.member});
});

// client auth
app.get('/login', member.login_form);
app.post('/login', member.login);
app.get('/logout', member.logout);

// schedule
app.get('/schedule', schedule.schedule);
app.get('/schedule/:year/:month', schedule.month_schedule);
app.post('/schedule', schedule.create_shift);
app.post('/schedule/shift/delete/:shift_id', schedule.delete_shift);
app.post('/schedule/shift/:shift_id', schedule.update_shift);
app.get('/shift/:shift_id', schedule.get_shift);
app.get('/schedule/requirements.json', schedule.get_requirements);
app.get('/schedule/requirements/:member.json', schedule.get_requirements_for_member)
app.get('/schedule/requirements', schedule.requirements_form);
app.post('/schedule/message', schedule.edit_message);

// member management
app.get('/members', member.list);
app.get('/members/create', member.create_form);
app.post('/members/create', member.create);
app.get('/members/edit/:member', member.edit_form);
app.post('/members/edit/:member', member.edit);
app.post('/members/delete/:member', member.delete);
app.post('/members/reset_password/:member', member.reset_password);
app.get('/me/change_password', member.change_password_form);
app.post('/me/change_password', member.change_password);
app.get('/me', member.display_self);

// events
app.get('/events', events.list);
app.get('/events/create', events.create_form);
app.post('/events/create', events.create);
app.post('/events/delete/:event', events.delete);

// JSON feeds of the models
app.get('/shifts.json', jsonFeed.shifts);
app.get('/members.json', jsonFeed.members);

// finally create the server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

// this will prevent heroku from sleeping
setInterval(function () {
	http.get('http://bergems.herokuapp.com/', function (res) {
		console.log('Got home page');
	});
}, 45 * 60 * 1000);