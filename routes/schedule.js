var moment = require('moment');

var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
	return;
}

exports.schedule = function (req, res) {
	var now = moment();
	res.redirect('/schedule/' + now.year() + '/' + now.format('MM') );
};

exports.month_schedule = function (req, res) {

	if (!req.session.member) {
		return res.redirect('/');
	}

	// test that year and month are valid
	var intRegex = /^\d+$/;
	if (!intRegex.test(req.params.month) || !intRegex.test(req.params.year)) {
		return res.redirect('/schedule');
	}

	var days = [];

	var now = moment()
		.year(req.params.year)
		.month(req.params.month-1)
		.date(1);

	var prev_month = moment(now).subtract('months', 1);
	var next_month = moment(now).add('months', 1);

	var month_start = now.day() - 1;
	if (month_start == -1) month_start = 6;

	var days_in_month = now.endOf("month").date();

	// set up days
	for (var i = 0; i < 42; i++) {

		var day;

		if (i < month_start) {
			day = {
				number: "",
				shifts: {
					crew_chief: [],
					member: [],
					training_corps: []
				},
				incomplete: false,
				in_month: false,
				editable: true
			}
		} else if (i - month_start < days_in_month) {
			day = {
				number: i - month_start + 1,
				shifts: {
					crew_chief: [],
					member: [],
					training_corps: []
				},
				incomplete: false,
				in_month: true,
				editable: true
			}
		} else {
			day = {
				number: "",
				shifts: {
					crew_chief: [],
					member: [],
					training_corps: []
				},
				incomplete: false,
				in_month: false,
				editable: true
			}
		}
		days[i] = day;
	}

	// populate shifts
	var Shift = mongoose.model('Shift');

	Shift.find({
		"start": {
			"$gte": moment()
				.year(req.params.year)
				.month(req.params.month - 1)
				.date(1)
				.toDate(),
			"$lte": moment()
				.year(req.params.year)
				.month(req.params.month - 1)
				.endOf('month')
				.toDate()
		}
	}).exec(function (err, shifts, count) {

		shifts.forEach(function (shift) {

			var s = {
				id: shift.id,
				start: moment(shift.start).format('HHmm'),
				start_t: shift.start,
				end: moment(shift.end).format('HHmm'),
				end_t: shift.end,
				name: shift.name,
				unit: shift.unit,
				driver: shift.driver,
				probationary: shift.probationary,
				crew_chief: shift.crew_chief,
				training_corps: shift.training_corps
			};

			var n = month_start + moment(shift.start).date() - 1;

			if (shift.crew_chief) {
				days[n].shifts.crew_chief.push(s);
			} else if (shift.training_corps) {
				days[n].shifts.training_corps.push(s);
			} else {
				days[n].shifts.member.push(s);
			}
		});

		var view = 'schedule/schedule_editOwn';

		if (req.session.member.account.permissions.schedule) {
			view = 'schedule/schedule_admin';
		}

		return res.render(view, {
			days: days,
			month: now.format('MMMM'),
			year: now.format('YYYY'),
			prev_month: {
				name: prev_month.format('MMMM'),
				url: '/schedule/' + prev_month.year() + '/' + (prev_month.month()+1)
			},
			next_month: {
				name: next_month.format('MMMM'),
				url: '/schedule/' + next_month.year() + '/' + (next_month.month()+1)
			}
		});
	});
};

exports.create_shift = function (req, res) {

	if (req.session.member) {

		var Shift = mongoose.model('Shift');

		display_name = req.session.member.name.first.substring(0, 1)
			+ '. ' + req.session.member.name.last;

		new Shift({
			start: new Date(req.body.start),
			end: new Date(req.body.end),
			name: display_name,
			unit: req.session.member.unit,
			crew_chief: req.session.member.status.crew_chief,
			probationary: req.session.member.status.probationary,
			driver: req.session.member.status.driver,
			training_corps: req.session.member.status.training_corps,
			_member: req.session.member._id
		}).save(function (err, shift, count) {
			res.json(200, {status: 'ok'});
		});
	} else {
		res.json(403, {status: 'not authorized'});
	}
};

exports.delete_shift = function (req, res) {
	if (req.session.member) {
		var Shift = mongoose.model('Shift');
		Shift.findOne({
			_id: mongoose.Types.ObjectId.fromString(req.params.shift_id),
			_member: req.session.member._id
		}).remove();

		res.json(200, {status: "complete"});
	} else {
		res.json(401, {status: "unauthorized"});
	}
};

exports.update_shift = function (req, res) {
	if (req.session.member) {
		var Shift = mongoose.model('Shift');
		Shift.update({ 
			_id: mongoose.Types.ObjectId.fromString(req.params.shift_id),
			_member: req.session.member._id
		}, {
			start: new Date(req.body.start),
			end: new Date(req.body.end)
		}, function (err, count) {
			if (err) {
				res.json(500, {status: "error"});
			} else {
				res.json(200, {status: "success"});
			}
		});
	} else {
		res.json(401, {status: "unauthorized"});
	}
	
};

exports.get_shift = function (req, res) {
	var Shift = mongoose.model('Shift');
	Shift.findOne({ _id: mongoose.Types.ObjectId.fromString(req.params.shift_id)}, function (err, item) {
		if (err) {
			res.json(500, {error: err});
		} else {
			res.json(200, item);
		}
	});
};