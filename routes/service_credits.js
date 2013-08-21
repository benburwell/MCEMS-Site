var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
};

exports.list = function (req, res) {

	if (req.session.member
		&& req.session.member.account.permissions.service_credit) {

		var ServiceCredit = mongoose.model('ServiceCredit');
		ServiceCredit
			.find()
			.sort('approved')
			.populate('_member', 'name')
			.populate('_approver', 'name')
			.exec(function (err, items) {
				res.render('service_credits/list', { credits: items, moment: require('moment') });
		});

	} else {
		res.redirect('/');
	}

};

exports.json = function (req, res) {

	if (req.session.member) {

		// if they can't see members and aren't looking at self
		if (!req.session.member.account.permissions.members
			&& req.session.member._id != req.params.member) {
			return res.json(403, {});
		}

		var id = mongoose.Types.ObjectId.fromString(req.params.member);

		var ServiceCredit = mongoose.model('ServiceCredit');
		ServiceCredit
			.find({ _member: id })
			.populate('_approver', 'name')
			.exec(function (err, credits) {
				res.json(200, credits);
			});

	} else {
		res.json(403, {});
	}

};

exports.create = function (req, res) {

	if (req.session.member) {

		var ServiceCredit = mongoose.model('ServiceCredit');
		var data = {
			_member: req.session.member._id,
			description: req.body.description,
			request_date: new Date(),
			credit_date: new Date(req.body.date),
			approved: false
		};
		
		new ServiceCredit(data).save(function (err) {

			// find members who can approve credits
			var Member = mongoose.model('Member');
			Member
				.find()
				.where('account.permissions.service_credit').equals(true)
				.where('school_email').ne(null)
				.select('school_email')
				.exec(function (err, emails) {

					var messages = [];

					emails.forEach(function (email) {

						var message = {
							'To': email.school_email,
							'From': 'webmaster@bergems.org',
							'Subject': 'Service Credit Requested',
							'TextBody': 'A member has requested a service'
								+ 'credit. Description:\n\n'
								+ data.description
								+ '\n\nSign on to approve or reject.'
						};

						messages.push(message);

					});

					postmark.batch(messages, function (error, success) {
						res.json(200, {status: 'done'});
					});

				});
		});

	} else {
		res.json(403, {status: '403'});
	}
};

exports.approve = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.service_credit) {

		var id = mongoose.Types.ObjectId.fromString(req.params.credit);

		var ServiceCredit = mongoose.model('ServiceCredit');
		ServiceCredit.update( { _id: id }, {
			approved: true,
			_approver: req.session.member._id
		}, function (err) {
			res.redirect('/members/service-credits');
		});
	} else {
		res.redirect('/');
	}
};

exports.reject = function (req, res) {

	if (req.session.member
		&& req.session.member.account.permissions.service_credit) {

		var id = mongoose.Types.ObjectId.fromString(req.params.credit);

		var ServiceCredit = mongoose.model('ServiceCredit');
		ServiceCredit.remove({ _id: id }, function (err) {
			res.redirect('/members/service-credits');
		});
	} else {
		res.redirect('/');
	}

};