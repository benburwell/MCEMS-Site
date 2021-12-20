var mongoose;
exports._connect = function (m) {
	mongoose = m;
};

var sendgrid = require('../sendgrid');

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
			var briefRecipients = [];
			var fullRecipients = [];

			emails.forEach(function (email) {
				if (email.mobile.carrier != undefined) {
					briefRecipients.push(email.address);
				} else {
					fullRecipients.push(email.address);
				}
			});

			// now get school_emails
			var Member = mongoose.model('Member');
			Member.find()
				.and([
					{ 'school_email': { '$ne': null } },
					{ 'school_email': { '$ne': '' } }
				])
				.exec(function (err, emails) {
					emails.forEach(function(email) {
						fullRecipients.push(email.school_email);
					});

					var fullMessage = {
						to: fullRecipients,
						subject: req.body.subject,
						text: req.body.full,
						isMultiple: true,
					};

					var briefMessage = {
						to: briefRecipients,
						subject: 'MCEMS',
						text: req.body.brief,
						isMultiple: true,
					};

					sendgrid.send([ fullMessage, briefMessage ], function (error) {
						return res.render('broadcast/sent', {
							error: error,
						});
					});
				});
		});

	} else {
		res.redirect('/');
	}
};
