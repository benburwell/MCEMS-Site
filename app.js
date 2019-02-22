// require components
var express         = require('express'),
	mongoose        = require('mongoose'),
	http            = require('http'),
	path            = require('path'),
	morgan          = require('morgan'),
	favicon         = require('serve-favicon'),
	cookieParser    = require('cookie-parser'),
	session         = require('express-session'),
	bodyParser      = require('body-parser'),
	methodOverride  = require('method-override'),
	errorHandler    = require('errorhandler'),

	crypto          = require('crypto'),
	cron            = require('cron').CronJob,
	moment          = require('moment'),
	jsontoxml       = require('jsontoxml'),
	passport        = require('passport'),
	DigestStrategy  = require('passport-http').DigestStrategy,

	// models for mongoose
	models          = require('./models'),

	// pepper for passwords
	pepper          = require('./pepper'),

	// sendgrid for emails
	sendgrid        = require('./sendgrid'),

	// routes
	member          = require('./routes/member'),
	events          = require('./routes/events'),
	pages           = require('./routes/pages'),
	certifications  = require('./routes/certifications'),
	emails          = require('./routes/emails'),
	broadcast       = require('./routes/broadcast'),
	application     = require('./routes/application'),
	service_credits = require('./routes/service_credits'),
	api             = require('./routes/api'),
	schedule        = require('./routes/schedule');

var app = express();

// database things
var Schema = mongoose.Schema;

// create models
mongoose.model('Shift', new Schema(models.shift));
mongoose.model('Member', new Schema(models.member));
mongoose.model('Event', new Schema(models.event));
mongoose.model('System', new Schema(models.system));
mongoose.model('Email', new Schema(models.email));
mongoose.model('Certification', new Schema(models.certification));
mongoose.model('ServiceCredit', new Schema(models.service_credit));
mongoose.model('Page', new Schema(models.page));
mongoose.model('Applicant', new Schema(models.applicant));
mongoose.model('Interview', new Schema(models.interview));

// connect to db
var uristring = process.env.MONGOLAB_URI
	|| process.env.MONGOHQ_URL
	|| 'mongodb://127.0.0.1/mcems';
mongoose.connect(uristring);

// put mongoose in modules
member._connect(mongoose);
schedule._connect(mongoose);
events._connect(mongoose);
certifications._connect(mongoose);
emails._connect(mongoose);
broadcast._connect(mongoose);
service_credits._connect(mongoose);
pages._connect(mongoose);
application._connect(mongoose);
api._connect(mongoose);

// settings for all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

// middleware stack
app.use(morgan('dev'));
app.use(favicon(__dirname + '/public/static/favicon.ico'));
app.use(cookieParser());
app.use(session({secret: pepper.secret }));

// this will set authMember for easy use in Jade templates
app.use(function (req, res, next) {
	res.locals.authMember = req.session.member;

	if (req.path == '/page/home') {
		res.locals.canonical_link = 'http://www.bergems.org/';
	} else {
		res.locals.canonical_link = 'http://www.bergems.org' + req.path;
	}
	
	var Page = mongoose.model('Page');
	var query = { show_in_nav: true };
	
	if (!req.session.member) {
		query.public = true;
	}

	Page.find(query, function (err, pages) {
		res.locals.nav_items = pages;
		next();
	});
});

// passport
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// passport config
passport.use(new DigestStrategy({ qop: 'auth' }, function (username, done) {
	if (username == process.env.MCEMS_API_USER) {
		return done(null, username, process.env.MCEMS_API_PASS);
	} else {
		return done(null, false);
	}
}, function (params, done) {
	done(null, true);
}));

// static content pages
app.route('/asdfasdfasdf').get(function(req, res) {
    res.end("Hello!");
});
app.route('/').get(member.login_form);

// client auth
app.route('/login').get(member.login_form).post(member.login);
app.route('/logout').get(member.logout);

// schedule
app.route('/schedule').get(schedule.schedule).post(schedule.create_shift);
app.route('/schedule/:year/:month').get(schedule.month_schedule);
app.route('/schedule/shift/delete/:shift_id').post(schedule.delete_shift);
app.route('/schedule/shift/:shift_id').post(schedule.update_shift);
app.route('/shift/:shift_id').get(schedule.get_shift);
app.route('/schedule/message').post(schedule.edit_message);
app.route('/members/shifts/:member.json').get(schedule.member_shifts);
app.route('/members/stats/:member.json').get(schedule.member_hours_json);
app.route('/schedule/ical/:member/:id.ics').get(schedule.future_shift_ics);
app.route('/duty.ics').get(schedule.duty_ics);
app.route('/schedule/duty-report/').get(schedule.duty_report);

// member management
app.route('/members').get(member.list);
app.route('/members/create').get(member.create_form).post(member.create);
app.route('/members/edit/:member').get(member.edit_form).post(member.edit);
app.route('/members/delete/:member').post(member.delete);
app.route('/members/reset_password/:member').post(member.reset_password);
app.route('/me/change_password').get(member.change_password_form).post(member.change_password);

// certifications
app.route('/members/certifications').get(certifications.table);
app.route('/members/certifications/:member.json').get(certifications.get_json);
app.route('/members/certifications/create').post(certifications.create);
app.route('/members/certifications/delete').post(certifications.delete);

// emails
app.route('/members/emails/:member.json').get(emails.get_json);
app.route('/members/emails/create').post(emails.create);
app.route('/members/emails/delete').post(emails.delete);
app.route('/members/emails/confirm').post(emails.confirm);

// service credits
app.route('/members/service-credits').get(service_credits.list).post(service_credits.create);
app.route('/members/service-credits/:member.json').get(service_credits.json);
app.route('/members/service-credits/approve/:credit').post(service_credits.approve);
app.route('/members/service-credits/reject/:credit').post(service_credits.reject);

// events
app.route('/events').get(events.list);
app.route('/events/create').get(events.create_form).post(events.create);
app.route('/events/delete/:event').post(events.delete);

// broadcast
app.route('/broadcast').get(broadcast.form).post(broadcast.send);

// pages
app.route('/page/:page').get(pages.render);
app.route('/pages').get(pages.list);
app.route('/pages/edit/:page').get(pages.edit_form).post(pages.edit);
app.route('/pages/create').post(pages.create).get(pages.create_form);
app.route('/pages/delete/:page').post(pages.delete);

// application
app.route('/apply').get(application.form).post(application.submit);
app.route('/applicants').get(application.list_applicants);
app.route('/applicants/edit/:id').get(application.display_applicant).post(application.update_applicant);
app.route('/applicants/migrate/:id').get(application.migration_form);
app.route('/applicants/delete/:id').post(application.delete_applicant);
app.route('/applicants/interview-slots.json').get(application.interview_slots_json);
app.route('/applicants/interview-slots').post(application.create_interview_slot);
app.route('/applicants/interview-slots/delete/:id').post(application.delete_interview_slot);
app.route('/applicants/open').post(application.open_applications);
app.route('/applicants/close').post(application.close_applications);

// app.get('/api/cad/on_duty.json', passport.authenticate('digest', { session: false }), api.on_duty);
app.route('/api/cad/on_duty.json').get(api.on_duty);

app.use(function (req, res) {
	res.status(404);
	res.render('404');
});

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// finally create the server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

// set up certification expiry emails
var Certification = mongoose.model('Certification');
Certification.find().populate('_member').exec(function (err, certs) {

	certs.forEach(function (cert) {

		if (cert.expiry) {
			if (cert._member.school_email) {

				var email = {
					to: cert._member.school_email,
					subject: 'Expiring Certification',
					text: 'Hi '
						+ cert._member.name.first + ', \n\n'
						+ 'The ' + cert.type + ' certification you have on '
						+ 'file with MCEMS expires in 60 days on '
						+ moment(cert.expiry).format('MMMM D, YYYY') + '. \n\n'
						+ 'Please provide the secretary with your updated certification '
						+ 'as soon as you are able. \n\n'
						+ 'Thanks!'
				};

				var send_date = moment(cert.expiry).subtract('days', 60);

				if (send_date.isAfter(moment())) {
					var job = new cron({
						cronTime: send_date.toDate(),
						onTick: function () {
							sendgrid.send(email)
						},
						start: true
					});
				}
			}
		}
	});
});
