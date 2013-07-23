
/**
 * Module dependencies.
 */

var express = require('express'),
	mongoose = require('mongoose'),
	http = require('http'),
	path = require('path'),

	// models for mongoose
	models = require('./models'),

	// routes
	jsonFeed = require('./routes/json'),
	user = require('./routes/user'),
	member = require('./routes/member'),
	schedule = require('./routes/schedule');

var app = express();

// Database things
var Schema = mongoose.Schema;

// create models
mongoose.model('Shift', new Schema(models.shift));
mongoose.model('User', new Schema(models.member));
mongoose.model('Member', new Schema(models.user));

// connect to db
var uristring = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://localhost/mcems';
mongoose.connect(uristring);

// all environments
app.set('port', process.env.PORT || 3000);

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', function (req, res) {
	res.render('index', {user: req.session.user});
});

// client auth
app.get('/login', user.login_form);
app.post('/login', user.login(mongoose));
app.get('/logout', user.logout);

// schedule
app.get('/schedule', schedule.schedule(mongoose));
app.get('/schedule/:year/:month', schedule.month_schedule(mongoose));
app.post('/schedule', schedule.create_shift(mongoose));
app.post('/schedule/shift/delete/:shift_id', schedule.delete_shift(mongoose));
app.post('/schedule/shift/:shift_id', schedule.update_shift(mongoose));
app.get('/shift/:shift_id', schedule.get_shift(mongoose));

// user management
app.get('/users', user.list(mongoose));
app.get('/users/create', user.create_form(mongoose));
app.post('/users/create', user.create(mongoose));

// member management
app.get('/members', member.list(mongoose));
app.get('/members/create', member.create_form);
app.post('/members/create', member.create(mongoose));
app.get('/members/edit/:member', member.edit_form(mongoose));
app.post('/members/edit/:member', member.edit(mongoose));
app.post('/members/delete/:member', member.delete(mongoose));

// JSON feeds of the models
app.get('/shifts.json', jsonFeed.shifts(mongoose));
app.get('/members.json', jsonFeed.members(mongoose));
app.get('/users.json', jsonFeed.users(mongoose));

// finally create the server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
