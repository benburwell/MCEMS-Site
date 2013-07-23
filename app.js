
/**
 * Module dependencies.
 */

var express = require('express'),
	mongoose = require('mongoose'),
	http = require('http'),
	path = require('path'),
	postmark = require('postmark')(process.env.POSTMARK_API_KEY),

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

// put mongoose in modules
member._connect(mongoose, postmark);
user._connect(mongoose, postmark);
schedule._connect(mongoose, postmark);

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
app.post('/login', user.login);
app.get('/logout', user.logout);

// schedule
app.get('/schedule', schedule.schedule);
app.get('/schedule/:year/:month', schedule.month_schedule);
app.post('/schedule', schedule.create_shift);
app.post('/schedule/shift/delete/:shift_id', schedule.delete_shift);
app.post('/schedule/shift/:shift_id', schedule.update_shift);
app.get('/shift/:shift_id', schedule.get_shift);

// user management
app.get('/users', user.list);
app.get('/users/create', user.create_form);
app.post('/users/create', user.create);

// member management
app.get('/members', member.list);
app.get('/members/create', member.create_form);
app.post('/members/create', member.create);
app.get('/members/edit/:member', member.edit_form);
app.post('/members/edit/:member', member.edit);
app.post('/members/delete/:member', member.delete);

// JSON feeds of the models
app.get('/shifts.json', jsonFeed.shifts);
app.get('/members.json', jsonFeed.members);
app.get('/users.json', jsonFeed.users);

// finally create the server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
