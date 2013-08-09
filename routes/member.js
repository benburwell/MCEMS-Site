var jsonConcat = function (o1, o2) {
	for (var key in o2) {
 		o1[key] = o2[key];
	}
	return o1;
};

var pepper = require('../pepper'),
	moment = require('moment'),
	crypto = require('crypto');

var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
	return;
}

exports.login_form = function (req, res) {
	var msg;
	
	if (req.session.invalid_login) {
		req.session.invalid_login = false;
		msg = 'Invalid username or password';
	}

	return res.render('members/login', {message: msg});
};

exports.login = function (req, res) {

	if (req.body.username != '' && req.body.password != '') {

		var Member = mongoose.model('Member');

		Member.findOne()
			.where('account.username').equals(req.body.username)
			.where('account.login_enabled').equals(true)
			.exec(function (err, member) {

				if (member) {
					var hash = crypto.createHash('sha1');
					hash.update(req.body.password);
					hash.update(member.account.password.salt);
					hash.update(pepper.pepper);

					if (hash.digest('hex') == member.account.password.hash) {
						// login success!
						req.session.member = member;
						res.redirect('/');
					} else {
						req.session.invalid_login = true;
						res.redirect('/login');
					}
				} else {
					req.session.invalid_login = true;
					res.redirect('/login');
				}
			});

	} else {
		req.session.invalid_login = true;
		res.redirect('/login');
	}
};

exports.logout = function (req, res) {
	req.session.member = null;
	res.redirect('/');
};

exports.list = function (req, res) {

	if (req.session.member) {

		var Member = mongoose.model('Member');
		Member
			.find()
			.sort('name.last')
			.sort('name.first')
			.exec(function (err, members, count) {
			if (err) {
				return res.json(500, {error: err});
			} else {
				return res.render('members/list', {members: members});
			}
		});

	} else {
		res.redirect('/');
	}
};

exports.create_form = function (req, res) {

	if (req.session.member &&
		(req.session.member.account.permissions.members
		|| req.session.member.account.permissions.accounts)) {

		res.render('members/create');

	} else {
		res.render('error', {
			title: 'Unauthorized',
			message: 'Sorry, you are not allowed to perform that function.'
		});
	}
};

exports.create = function (req, res) {

	if (req.session.member &&
		(req.session.member.account.permissions.members
		|| req.session.member.account.permissions.accounts)) {

		crypto.randomBytes(128, function (ex, salt) {

			var s = crypto.createHash('sha1');
			s.update(salt);
			salt = s.digest('hex');

			var password = crypto.createHash('sha1');
			password.update(req.body.password);
			password.update(salt);
			password.update(pepper.pepper);

			var hash = password.digest('hex');

			var Member = mongoose.model('Member');
			new Member({
				name: {
					first: req.body.first_name,
					last: req.body.last_name
				},
				account: {
					username: req.body.username,
					password: {
						salt: salt,
						hash: hash
					},
					login_enabled: true
				},
				status: {
					training_corps: false,
					probationary: false,
					emt: false,
					driver_trainee: false,
					driver: false,
					crew_chief_trainee: false,
					crew_chief: false
				}
			}).save(function (err, member) {
				return res.redirect('/members');
			});
		});

	} else {
		res.render('error', {
			title: 'Unauthorized',
			message: 'Sorry, you are not allowed to perform that function.'
		});
	}
};

exports.edit_form = function (req, res) {
	var Member = mongoose.model('Member');
	Member
		.findOne({ _id: mongoose.Types.ObjectId.fromString(req.params.member) })
		.exec(function (err, item) {
			if (err) {
				return res.json(404, {error: 'No such member'});
			} else {
				if (req.session.member != undefined) {

					var edit_account = req.session.member.account.permissions.accounts;
					var edit_member = req.session.member.account.permissions.members;

					res.render('members/edit', {
						member: item,
						edit_account: edit_account,
						edit_member: edit_member,
						moment: moment
					});

				} else {
					return res.redirect('/');
				}
			}
		});
};

exports.edit = function (req, res) {
	var Member = mongoose.model('Member');

	var resetPassword;

	var account = {
		'account.username': req.body.username,
		'account.login_enabled': (req.body.login_enabled == 'true')? true : false,
		'account.permissions.schedule': (req.body.schedule == 'true')? true : false,
		'account.permissions.members': (req.body.members == 'true')? true : false,
		'account.permissions.pages': (req.body.pages == 'true')? true : false,
		'account.permissions.accounts': (req.body.accounts == 'true')? true : false,
		'account.permissions.events': (req.body.events == 'true')? true : false,
		'account.permissions.broadcast': (req.body.broadcast == 'true')? true : false,
		'account.permissions.service_credit': (req.body.service_credit == 'true')? true : false
	};

	var member = {
		'name.first': req.body.first_name,
		'name.last': req.body.last_name,
		'unit': req.body.unit,
		'class_year': req.body.class_year,
		'campus_box': req.body.campus_box,
		'campus_address': req.body.campus_address,
		// 'home_address.line_1': req.body.home_address_line_1,
		// 'home_address.line_2': req.body.home_address_line_2,
		// 'home_address.city': req.body.home_city,
		// 'home_address.state': req.body.home_state,
		// 'home_address.zip': req.body.home_zip,
		// 'home_address.country': req.body.home_country,
		'phone': req.body.phone,
		'school_email': req.body.school_email,
		'status.training_corps': (req.body.training_corps == 'true')? true : false,
		'status.probationary': (req.body.probationary == 'true')? true : false,
		'status.emt': (req.body.emt == 'true')? true : false,
		'status.driver_trainee': (req.body.driver_trainee == 'true')? true : false,
		'status.driver': (req.body.driver == 'true')? true : false,
		'status.crew_chief_trainee': (req.body.crew_chief_trainee == 'true')? true : false,
		'status.crew_chief': (req.body.crew_chief == 'true')? true : false
	};

	var both = jsonConcat(account, member);

	var id = mongoose.Types.ObjectId.fromString(req.params.member);
	var update;

	if (req.session.member != undefined) {
		if (req.session.member.account.permissions.members) {
			if (req.session.member.account.permissions.accounts) {
				update = both;
			} else {
				update = member;
			}
		} else if (req.session.member.account.permissions.accounts) {
			update = account;
		} else {
			return res.redirect('/members');
		}
	} else {
		return res.redirect('/members');
	}

	Member.update({_id: id}, update, function (err, count) {
		if (err) console.error(err);
		res.redirect('/members');
	});
};

exports.reset_password = function (req, res) {
	if (req.session.member) {
		if (req.session.member.account.permissions.accounts) {

			var id = mongoose.Types.ObjectId.fromString(req.params.member);
			var Member = mongoose.model('Member');

			crypto.randomBytes(134, function (ex, salt) {

				var s = crypto.createHash('sha1');
				s.update(salt);
				salt = s.digest('hex');

				var plain = salt.substring(0, 6);

				var password = crypto.createHash('sha1');
				password.update(plain);
				password.update(salt);
				password.update(pepper.pepper);

				var hash = password.digest('hex');

				Member.update({_id: id}, {
					'account.password.hash': hash,
					'account.password.salt': salt
				}, function (err) {
					res.json(200, {status: 'ok', plaintext: plain});
				});

			});

		} else {
			res.json(401, {status: "unauthorized"});
		}
	} else {
		res.json(401, {status: "unauthorized"});
	}
};

exports.delete = function (req, res) {
	var Member = mongoose.model('Member');
	if (req.session.member && req.session.member.account.permissions.members) {
		Member.remove({ _id: mongoose.Types.ObjectId.fromString(req.params.member) }, function (err) {
			res.json(200, {status: 'done'});
		});
	}
};

exports.change_password_form = function (req, res) {
	if (req.session.member) {
		res.render('members/change_password');
	} else {
		res.redirect('/');
	}
};

exports.change_password = function (req, res) {

	if (req.session.member) {

		if (req.body.new_password && req.body.new_password.length < 5) {
			return res.render('error', {
				title: 'Error',
				message: 'Your password must be 5 or more characters.'
			});
		}

		// verify old password
		var old = crypto.createHash('sha1');
		old.update(req.body.old_password);
		old.update(req.session.member.account.password.salt);
		old.update(pepper.pepper);

		if (old.digest('hex') == req.session.member.account.password.hash) {

			var pass = crypto.createHash('sha1');
			pass.update(req.body.new_password);
			pass.update(req.session.member.account.password.salt);
			pass.update(pepper.pepper);
			
			var hash = pass.digest('hex');

			var Member = mongoose.model('Member');

			Member.update({
				_id: req.session.member._id,
			}, {
				'account.password.hash': hash
			}, function (err) {
				res.redirect('/logout');
			});

		} else {
			res.render('error', {
				title: 'Error',
				message: 'You did not correctly enter your old password'
			});
		}
	} else {
		res.redirect('/');
	}
};

exports.display_self = function (req, res) {
	if (req.session.member) {
		if (req.session.member.account.permissions.members
			|| req.session.member.account.permissions.accounts) {
			res.redirect('/members/edit/' + req.session.member._id);
		} else {
			res.render('members/edit', {
				member: req.session.member,
				edit_member: false,
				edit_account: false
			});
		}
	} else {
		res.redirect('/');
	}
}