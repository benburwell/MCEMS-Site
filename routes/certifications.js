var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
};

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
	Certification.find( {_member: id}, function (err, items) {
		res.json(200, items);
	});
};

exports.create = function (req, res) {
	if (!req.session.member) {
		return res.json(403, {error: 'not authorized'});
	}

	var id = req.session.member._id;

	if (req.session.member.account.permissions.members) {
		if (req.body.member) {
			id = mongoose.Types.ObjectId.fromString(req.body.member);			
		}
	}

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

	var query = { _id: mongoose.Types.ObjectId.fromString(req.body.id) };

	if (!req.session.member.account.permissions.members) {
		query._member = req.session.member._id;
	}

	var Certification = mongoose.model('Certification');
	Certification.findOne(query).remove(function (err) {
		if (err) {
			res.json(500, {error: err});
		} else {
			res.json(200, {status: 'ok'});
		}
	});
	
};