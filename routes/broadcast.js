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
					'From': 'bb246500@muhlenberg.edu',
					'To': email.address,
					'Subject': req.body.subject,
					'TextBody': null
				};

				if (email.mobile.carrier != undefined) {
					if (req.body.brief) {
						message.TextBody = req.body.brief
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

			postmark.batch(messages, function (error, success) {
				res.render('broadcast/sent', {emails: emails});
			});

			res.render('broadcast/sent', {emails: emails});

		});

	} else {
		res.redirect('/');
	}
};