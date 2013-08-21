var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
};

exports.form = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.broadcast) {
		res.render('broadcast/form');
	} else {
		res.redirect('/');
	}
};

exports.send = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.broadcast) {
		
		var Email = mongoose.model('Email');
		Email.find({confirmed: true}).populate('_member').exec(function (err, emails) {

			var messages = [];

			emails.forEach(function (email) {

				var message = {
					'From': 'webmaster@bergems.org',
					'To': email.address,
					'Subject': req.body.subject,
					'TextBody': null
				};

				if (email.mobile.carrier != undefined) {
					if (req.body.brief) {
						message.TextBody = req.body.brief,
						message.Subject = ''
					} else {
						return;
					}
				} else {
					if (req.body.full) {
						message.TextBody = req.body.full
					} else {
						return;
					}
				}

				message.TextBody += ' (#' + req.session.member.unit + ')';

				messages.push(message);

			});

			// now get school_emails
			var Member = mongoose.model('Member');
			Member.find()
				.where('school_email').ne(null)
				.select('school_email')
				.exec(function (err, emails) {

					emails.forEach(function (email) {
						var message = {
							'From': 'webmaster@bergems.org',
							'To': email.school_email,
							'Subject': req.body.subject,
							'TextBody': req.body.full
						};
						messages.push(message);
					});

					postmark.batch(messages, function (error, success) {
						res.render('broadcast/sent', {emails: emails});
					});

					res.render('broadcast/sent', {messages: messages});

				});
		});

	} else {
		res.redirect('/');
	}
};