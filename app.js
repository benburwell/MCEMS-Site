// initialize logging
require('newrelic');

// require components
var express         = require('express'),
	mongoose        = require('mongoose'),
	http            = require('http'),
	path            = require('path'),

	// use the local version until npmjs is updated
	postmark        = require('postmark')(process.env.POSTMARK_API_KEY),
	
	crypto          = require('crypto'),
	assetManager    = require('connect-assetmanager'),
	assetHandler    = require('connect-assetmanager-handlers'),
	cron            = require('cron').CronJob,
	moment          = require('moment'),
	jsontoxml       = require('jsontoxml'),
	passport        = require('passport'),
	DigestStrategy  = require('passport-http').DigestStrategy,

	// models for mongoose
	models          = require('./models'),

	// pepper for passwords
	pepper          = require('./pepper'),

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
	|| 'mongodb://localhost/mcems';
mongoose.connect(uristring);

// put mongoose in modules
member._connect(mongoose, postmark);
schedule._connect(mongoose, postmark);
events._connect(mongoose, postmark);
certifications._connect(mongoose, postmark);
emails._connect(mongoose, postmark);
broadcast._connect(mongoose, postmark);
service_credits._connect(mongoose, postmark);
pages._connect(mongoose, postmark);
application._connect(mongoose, postmark);
api._connect(mongoose, postmark);

// asset manager configuration
var asset_manager_groups = {
	'css': {
		'route': /\/static\/mcems\.css/,
		'path': './public/stylesheets/',
		'dataType': 'css',
		'files': ['*'],
		'postManipulate': {
			'^': [ assetHandler.yuiCssOptimize ]
		}
	}
};

// settings for all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// middleware stack
app.use(express.logger('dev'));
app.use(express.favicon(__dirname + '/public/static/favicon.ico'));
app.use(express.cookieParser());
app.use(express.session({secret: pepper.secret }));

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

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(assetManager(asset_manager_groups));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res) {
	res.status(404);
	res.render('404');
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

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
app.get('/', pages.index);

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
app.post('/schedule/message', schedule.edit_message);
app.get('/members/shifts/:member.json', schedule.member_shifts);
app.get('/members/stats/:member.json', schedule.member_hours_json);
app.get('/schedule/ical/:member/:id.ics', schedule.future_shift_ics);
app.get('/duty.ics', schedule.duty_ics);
app.get('/schedule/duty-report/', schedule.duty_report);

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

// certifications
app.get('/members/certifications', certifications.table);
app.get('/members/certifications/:member.json', certifications.get_json);
app.post('/members/certifications/create', certifications.create);
app.post('/members/certifications/delete', certifications.delete);

// emails
app.get('/members/emails/:member.json', emails.get_json);
app.post('/members/emails/create', emails.create);
app.post('/members/emails/delete', emails.delete);
app.post('/members/emails/confirm', emails.confirm);

// service credits
app.get('/members/service-credits', service_credits.list);
app.get('/members/service-credits/:member.json', service_credits.json);
app.post('/members/service-credits', service_credits.create);
app.post('/members/service-credits/approve/:credit', service_credits.approve);
app.post('/members/service-credits/reject/:credit', service_credits.reject);

// events
app.get('/events', events.list);
app.get('/events/create', events.create_form);
app.post('/events/create', events.create);
app.post('/events/delete/:event', events.delete);

// broadcast
app.get('/broadcast', broadcast.form);
app.post('/broadcast', broadcast.send);

// pages
app.get('/page/:page', pages.render);
app.get('/pages', pages.list);
app.get('/pages/edit/:page', pages.edit_form);
app.post('/pages/edit/:page', pages.edit);
app.post('/pages/create', pages.create);
app.get('/pages/create', pages.create_form);
app.post('/pages/delete/:page', pages.delete);

// application
app.get('/apply', application.form);
app.post('/apply', application.submit);
app.get('/applicants', application.list_applicants);
app.get('/applicants/edit/:id', application.display_applicant);
app.post('/applicants/edit/:id', application.update_applicant);
app.get('/applicants/migrate/:id', application.migration_form);
app.post('/applicants/delete/:id', application.delete_applicant);
app.get('/applicants/interview-slots.json', application.interview_slots_json);
app.post('/applicants/interview-slots', application.create_interview_slot);
app.post('/applicants/interview-slots/delete/:id', application.delete_interview_slot);
app.post('/applicants/open', application.open_applications);
app.post('/applicants/close', application.close_applications);

// app.get('/api/cad/on_duty.json', passport.authenticate('digest', { session: false }), api.on_duty);
app.get('/api/cad/on_duty.json', api.on_duty);

app.post('/hooks/postmark_inbound', emails.inbound_hook);

app.get('/sitemap.xml', function (req, res) {

	var Page = mongoose.model('Page');
	Page.find({
		public: true
	}).exec(function (err, pages) {
		var sitemap = [
			{
				name: 'urlset',
				attrs: { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' },
				children: []
			}
		];

		pages.forEach(function (page) {

			var data = {};
			data.loc = (page.url == 'home')? 'http://www.bergems.org/' : 'http://www.bergems.org/page/' + page.url

			if (page.last_modified) {
				data.lastmod = moment(page.last_modified).format();
			}

			sitemap[0].children.push({
				url: [
					data
				]
			});
		});

		res.type('xml');
		var xml = jsontoxml(sitemap, {
			xmlHeader: true
		});
		res.send(xml);
	});
});

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
					'To': cert._member.school_email,
					'From': 'webmaster@bergems.org',
					'Subject': 'Expiring Certification',
					'TextBody': 'Hi '
						+ cert._member.name.first + ', \n\n'
						+ 'The ' + cert.type + ' certification you have on '
						+ 'file with MCEMS expires in 60 days on '
						+ moment(cert.expiry).format('MMMM D, YYYY') + '. \n\n'
						+ 'Please provide the secretary with your updated certification '
						+ 'as soon as you are able. \n\n'
						+ 'Thanks!'
				};

				var send_date = moment(cert.expiry)
					.subtract('days', 60)
					.toDate();

				var job = new cron({
					cronTime: send_date,
					onTick: function () {
						postmark.send(email)
					},
					start: true
				});
			}
		}
	});
});
