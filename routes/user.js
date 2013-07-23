exports.login_form = function (req, res) {
	
	if (req.session.showInvalidMessage) {
		res.render('login', {invalid: true});
	} else {
		res.render('login');
	}

	req.session.showInvalidMessage = false;
};

exports.login = function (mongoose) {
	return function (req, res) {
		var User = mongoose.model('User');
		User.find(
			{
				username: req.body.username,
				password: req.body.password
			},
			function (err, users) {
				if (err) {
					res.json(500, {error: err});
				} else {

					if (users.length === 1) {
						User.update(
							{ username: req.body.username, password: req.body.password },
							{ last_login: new Date() },
							function (err, count) {
								req.session.user = users[0];
								res.redirect('/');
							});
					} else {
						req.session.showInvalidMessage = true;
						res.redirect('/login');
					}
				}
		});
	};
};

exports.logout = function (req, res) {
	req.session.user = null;
	res.redirect('/');
};

exports.list = function (mongoose) {
	return function (req, res) {
		var User = mongoose.model('User');
		User.find(function (err, users, count) {
			if (err) {
				res.json(500, {error: 'Error retriving users'});
				return;
			}
			res.render('users/list', {users: users});
		});
	};
};

exports.create_form = function (mongoose) {
	return function (req, res) {
		var Member = mongoose.model('Member');
		Member.find(function (err, members, count) {
			res.render('users/create', {members: members});
		});
	};
};

exports.create = function (mongoose) {
	return function (req, res) {

		var User = mongoose.model('User');

		new User({
			username: req.body.username,
			password: req.body.password,
			email: req.body.email,
			last_login: null,
			permissions: {
				calendar: {
					view: true,
					edit: true
				}
			},
			_member: req.body.member
		}).save(function (err, user, count) {
			res.redirect('/users');
		});
	};
};