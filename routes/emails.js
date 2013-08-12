var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
}

exports.get_json = function (req, res) {
	// check that there is a member logged in
	if (!req.session.member) {
		return res.redirect('/');
	}

	// if they can't see members and aren't looking at self
	if (!req.session.member.account.permissions.members
		&& req.session.member._id != req.params.member) {
		return res.redirect('/');
	}

	var id = mongoose.Types.ObjectId.fromString(req.params.member);

	var Email = mongoose.model('Email');
	Email.find( {_member: id}, 'address mobile confirmed', function (err, items) {
		res.json(200, items);
	});
};

exports.create = function (req, res) {

	if (!req.session.member) {
		res.json(403, {status: 'unauthorized'});
	}

	var Email = mongoose.model('Email');

	var data = {
		confirm_code: Math.round(Math.random() * 100000),
		confirmed: false,
		mobile: {},
		_member: req.session.member._id
	};

	if (req.body.address) {
		data.address = req.body.address;

		postmark.send({
			"From": "ems@muhlenberg.edu",
			"To": data.address,
			"Subject": "MCEMS Confirmation Code",
			"TextBody": "Hi,\n\nTo confirm this email address, go to "
				+ "your profile and click on this address. Enter the "
				+ "confirmation code: " + data.confirm_code
				+ "\n\n Thanks!"
		}, function (error, success) {
			new Email(data).save(function (err) {
				res.json(200, {status: 'ok'});
			});
		});

	} else {
		switch (req.body.carrier) {
			case 'Verizon':
				data.address = req.body.number + '@vtext.com';
				data.mobile.carrier = 'Verizon';
				data.mobile.number = req.body.number.replace(/\D/g, '');
				break;
			case 'AT&T':
				data.address = req.body.number + '@txt.att.com';
				data.mobile.carrier = 'AT&T';
				data.mobile.number = req.body.number;
			default:
				return;
		}

		postmark.send({
			"From": "ems@muhlenberg.edu",
			"To": data.address,
			"Subject": "",
			"TextBody": "MCEMS Confirmation Code: " + data.confirm_code
		}, function (error, success) {
			new Email(data).save(function (err) {
				res.json(200, {status: 'ok'});
			});
		});
	}

};

exports.delete = function (req, res) {

	if (!req.session.member) {
		return res.json(403, {error: 'not authorized'});
	}

	var query = {
		_id: mongoose.Types.ObjectId.fromString(req.body.id),
		_member: req.session.member._id
	};

	var Email = mongoose.model('Email');
	Email.findOne(query).remove(function (err) {
		if (err) {
			res.json(500, {error: err});
		} else {
			res.json(200, {status: 'ok'});
		}
	});

};

exports.confirm = function (req, res) {
	if (req.session.member) {

		var query = {
			_id: mongoose.Types.ObjectId.fromString(req.body.id),
			_member: req.session.member._id,
			confirm_code: req.body.code
		};

		var Email = mongoose.model('Email');
		Email.update(query, {'confirmed': true}, function (err) {
			res.json(200, {status: 'done'});
		});
	} else {
		res.json(403, {status: 'done'});
	}
};

exports.inbound_hook = function (req, res) {

	var messages = [];

	var Member = mongoose.model('Member');
	Member.find().where('school_email').ne(null).exec(function (err, members) {

		members.forEach(function (member) {
			var aliases = member.account.email_aliases.split(',');
			aliases.forEach(function (alias) {

				if (alias == req.body.To || req.body.ToFull && alias == req.body.ToFull.Email) {

					var email = {
						'From': 'ems@muhlenberg.edu',
						'To': member.school_email,
						'ReplyTo': req.body.FromFull ? req.body.FromFull.Email : req.body.From,
						'Subject': '[MCEMS] ' + req.body.Subject,
						'TextBody': req.body.TextBody,
						'HtmlBody': req.body.HtmlBody,
						'Attachments': req.body.Attachments
					};

					messages.push(email);
				}

			});
		});

		if (messages) {
			postmark.batch(messages, function (err, success) {
				res.json(200, {status: 'done'});
			});
		}
	});
};
