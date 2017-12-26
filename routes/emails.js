var mongoose;
exports._connect = function (m) {
	mongoose = m;
}

var sendgrid = require('../sendgrid')

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

	var id = mongoose.Types.ObjectId(req.params.member);

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

		sendgrid.send({
			to: data.address,
			subject: "MCEMS Confirmation Code",
			text: "Hi,\n\nTo confirm this email address, go to "
				+ "your profile and click on this address. Enter the "
				+ "confirmation code: " + data.confirm_code
				+ "\n\n Thanks!"
		}, function (error) {
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

		sendgrid.send({
			to: data.address,
			subject: "MCEMS",
			text: "MCEMS Confirmation Code: " + data.confirm_code
		}, function (error) {
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
		_id: mongoose.Types.ObjectId(req.body.id),
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
			_id: mongoose.Types.ObjectId(req.body.id),
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

