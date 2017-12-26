var mongoose;

exports._connect = function (m) {
	mongoose = m;
	return;
};

exports.list = function (req, res) {
	if (req.session.member) {

		var Event = mongoose.model('Event');
		Event.find(function (err, events) {
			res.render('events/list', {events: events});
		});

	} else {
		res.redirect('/');
	}
};

exports.create_form = function (req, res) {
	if (req.session.member) {
		if (req.session.member.account.permissions.events) {
			res.render('events/create');
		} else {
			res.redirect('/events');
		}
	} else {
		res.redirect('/');
	}
};

exports.create = function (req, res) {
	if (req.session.member && req.session.member.account.permissions.events) {
		var Event = mongoose.model('Event');
		new Event({
			title: req.body.title,
			type: req.body.type,
			link: req.body.link
		}).save(function (err) {
			res.redirect('/events');
		});
	} else {
		res.redirect('/events');
	}
};

exports.delete = function (req, res) {
	if (req.session.member && req.session.member.account.permissions.events) {
		var Event = mongoose.model('Event');
		Event.remove({
			_id: req.params.event
		}, function (err) {
			res.redirect('/events');
		});
	}
}
