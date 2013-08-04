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
	Email.find( {_member: id}, function (err, items) {
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
	} else {
		switch (req.body.carrier) {
			case 'Verizon':
				data.address = req.body.number + '@vtext.com';
				data.mobile.carrier = 'Verizon';
				data.mobile.number = req.body.number;
				break;
			case 'AT&T':
				data.address = req.body.number + '@txt.att.com';
				data.mobile.carrier = 'AT&T';
				data.mobile.number = req.body.number;
		}
	}

	new Email(data).save(function (err) {
		res.json(200, {status: 'ok'});
	});

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