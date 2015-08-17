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
			"From": "webmaster@bergems.org",
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

		data.mobile.number = req.body.number.replace(/\D/g, '');

		switch (req.body.carrier) {
			case 'Verizon':
				data.address = data.mobile.number + '@vtext.com';
				data.mobile.carrier = 'Verizon';
				break;
			case 'ATT':
				data.address = data.mobile.number + '@txt.att.com';
				data.mobile.carrier = 'ATT';
			case 'T-Mobile':
				data.address = data.mobile.number + '@tmomail.net';
				data.mobile.carrier = 'T-Mobile';
			case 'Virgin Mobile':
				data.address = data.mobile.number + '@vmobl.com';
				data.mobile.carrier = 'Virgin Mobile';
			case 'Cingular':
				data.address = data.mobile.number + '@cingularme.com';
				data.mobile.carrier = 'Cingular';
			case 'Sprint':
				data.address = data.mobile.number + '@messaging.sprintpcs.com';
				data.mobile.carrier = 'Sprint';
			case 'Nextel':
				data.address = data.mobile.number + '@messaging.nextel.com';
				data.mobile.carrier = 'Nextel';
			default:
				return;
		}

		postmark.send({
			"From": "webmaster@bergems.org",
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
	Member.find()
		.where('school_email').ne(null)
		.where('school_email').ne('')
		.where('account.email_aliases').ne(null)
		.exec(function (err, members) {

			if (err) {
				res.json(200, { status: 'error'})
			}

			var num_members = members.length;
			console.log(num_members, 'members found');
			for (var i = 0; i < num_members; i++) {
				
				var aliases = members[i].account.email_aliases.split(',');
				var num_aliases = aliases.length;

				for (var j = 0; j < num_aliases; j++) {
					var a = aliases[j] + '@bergems.org';
					a = a.toLowerCase();
					console.log('alias:', a);
					
					if (a == req.body.To.toLowerCase()) {

						var sender = req.body.FromFull ? req.body.FromFull.Email : req.body.From;

						var attachments = [];

						if (req.body.Attachments) {
							for (var k = 0; k < req.body.Attachments.length; k++) {
								attachments.push({
									'Name': req.body.Attachments[k].Name,
									'Content': req.body.Attachments[k].Content,
									'ContentType': req.body.Attachments[k].ContentType
								});
							}
						}

						var email = {
							'From': 'bounce@bergems.org',
							'To': members[i].school_email,
							'ReplyTo': sender,
							'Subject': '[MCEMS] ' + req.body.Subject,
							'TextBody': req.body.TextBody,
							'HtmlBody': req.body.HtmlBody,
							'Attachments': attachments,
							'Headers': [
								{
									'X-Forwarded-For': sender
								}
							]
						};
						messages.push(email);
					}
				}
			}
			
			if (messages.length > 0) {
				postmark.batch(messages, function (err, success) {
					res.json(200, {status: 'done'});
				});
			} else {
				res.json(200, {status: 'no_address_match'});
			}
	});
};
