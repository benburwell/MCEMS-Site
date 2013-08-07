var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
};

var moment = require('moment');

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

	var Certification = mongoose.model('Certification');
	Certification
		.find( {_member: id})
		.sort('expiry')
		.exec(function (err, items) {

			var certs_expiring = [];
			var other_certs = [];

			items.forEach(function (cert) {
				if (cert.expiry == null) {
					other_certs.push(cert);
				} else {
					certs_expiring.push(cert);
				}
			});

			other_certs.forEach(function (cert) {
				certs_expiring.push(cert);
			});

			res.json(200, certs_expiring);
	});
};

exports.create = function (req, res) {
	if (!req.session.member) {
		return res.json(403, {error: 'not authorized'});
	}

	if (!req.session.member.account.permissions.members) {
		return res.json(403, {error: 'not authorized'});
	}


	var id = mongoose.Types.ObjectId.fromString(req.body.member);

	var Certification = mongoose.model('Certification');

	var data = {
		type: req.body.type,
		number: req.body.number,
		_member: id
	};

	if (req.body.issue !== undefined) {
		data.issue = new Date(req.body.issue);
	}

	if (req.body.expiry !== undefined) {
		data.expiry = new Date(req.body.expiry);
	}

	new Certification(data).save(function (err) {
		if (err) {
			res.json(500, {status: 'error', message: err});
		} else {
			res.json(200, {status: 'ok'});
		}
	});
};

exports.delete = function (req, res) {

	if (!req.session.member) {
		return res.json(403, {error: 'not authorized'});
	}

	if (!req.session.member.account.permissions.members) {
		return res.json(403, {error: 'not authorized'});
	}

	var query = { _id: mongoose.Types.ObjectId.fromString(req.body.id) };

	var Certification = mongoose.model('Certification');
	Certification.findOne(query).remove(function (err) {
		if (err) {
			res.json(500, {error: err});
		} else {
			res.json(200, {status: 'ok'});
		}
	});
	
};

exports.table = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.members) {

		var Certification = mongoose.model('Certification');
		Certification.find().populate('_member').exec(function (err, certs) {
			res.render('members/certification_table', {certs: certs, moment: moment});
		});
	} else {
		res.redirect('/');
	}
};