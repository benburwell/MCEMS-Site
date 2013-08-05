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
			.populate('_member')
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
		ServiceCredit.find({ _member: id }, function (err, credits) {
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
			res.json(200, {status: 'done'});
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