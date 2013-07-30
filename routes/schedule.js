var moment = require('moment');

var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
	return;
}

var beginEditingForMoment = function (m) {
	return moment(m)
		.subtract('months', 1)
		.date(15)
		.hour(0)
		.minute(0)
		.second(0);
};

var endEditingForMoment = function (m) {
	return moment(m)
		.subtract('months', 1)
		.endOf('month')
		.hour(23)
		.minute(59)
		.second(59);
};

// for checking if a moment is editable by non-schedulers
var momentIsEditable = function (m) {

	var start = beginEditingForMoment(m);
	var end = endEditingForMoment(m);

	return start <= moment() && moment() < end;
};

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

	var month_is_editable = req.session.member.account.permissions.schedule
		|| momentIsEditable(now);

	// set up days
	for (var i = 0; i < 42; i++) {

		var day = {
			number: "",
			shifts: {
				crew_chief: [],
				member: [],
				training_corps: []
			},
			incomplete: false,
			in_month: true,
			editable: month_is_editable
		};

		if (i < month_start) {
			day.in_month = false;
			day.editable = false;
		} else if (i - month_start < days_in_month) {
			day.number = i - month_start + 1;
		} else {
			day.in_month = false;
			day.editable = false;
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

			var shiftEditable = req.session.member.account.permissions.schedule
				|| shift._member == req.session.member._id;

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
				training_corps: shift.training_corps,
				editable: shiftEditable
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

		var Member = mongoose.model('Member');
		Member.find(function (err, members) {
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
				},
				members: members
			});
		});
	});
};

exports.create_shift = function (req, res) {

	if (req.session.member) {

		if (req.session.member.account.permissions.schedule
			|| momentIsEditable( moment(req.body.start) )) {

			var Shift = mongoose.model('Shift');

			if (req.session.member.account.permissions.schedule) {
				var id = mongoose.Types.ObjectId.fromString(req.body.member);

				var Member = mongoose.model('Member');
				Member.findOne({_id: id}, function (err, member) {
					var data = {
						start: new Date(req.body.start),
						end: new Date(req.body.end),
						name: member.name.first.substring(0, 1) + '. '
							+ member.name.last,
						unit: member.unit,
						crew_chief: member.status.crew_chief,
						probationary: member.status.probationary,
						driver: member.status.driver,
						training_corps: member.status.training_corps,
						_member: member._id
					};

					new Shift(data).save(function (err) {
						res.json(200, {status: 'ok'});
					});
				})
			} else {
				var display_name = req.session.member.name.first.substring(0, 1)
				+ '. ' + req.session.member.name.last;

				var data = {
					start: new Date(req.body.start),
					end: new Date(req.body.end),
					name: display_name,
					unit: req.session.member.unit,
					crew_chief: req.session.member.status.crew_chief,
					probationary: req.session.member.status.probationary,
					driver: req.session.member.status.driver,
					training_corps: req.session.member.status.training_corps,
					_member: req.session.member._id
				};

				new Shift(data).save(function (err) {
					res.json(200, {status: 'ok'});
				});
			}
		} else {
			res.json(401, {status: 'not authorized'});
		}
	} else {
		res.json(403, {status: 'not authorized'});
	}
};

exports.delete_shift = function (req, res) {
	if (req.session.member) {
		var Shift = mongoose.model('Shift');

		// schedulers can remove anyone's shift
		if (req.session.member.account.permissions.schedule) {
			Shift.findOne({
				_id: mongoose.Types.ObjectId.fromString(req.params.shift_id)
			}).remove(function (err) {
				res.json(200, {status: 'complete'});
			});
		} else {
			Shift.findOne({
				_id: mongoose.Types.ObjectId.fromString(req.params.shift_id),
				_member: req.session.member._id
			}, function (err, shift) {

				if (momentIsEditable( moment(shift.start) )) {
					Shift.remove({
						_id: mongoose.Types.ObjectId.fromString(req.params.shift_id),
						_member: req.session.member._id
					}, function (err) {
						res.json(200, {status: "complete"});
					});
				}

			});
		}
	} else {
		res.json(401, {status: "unauthorized"});
	}
};

exports.update_shift = function (req, res) {
	if (req.session.member) {
		var Shift = mongoose.model('Shift');

		var search;
		if (req.session.member.account.permissions.schedule) {
			search = { 
				_id: mongoose.Types.ObjectId.fromString(req.params.shift_id)
			};
		} else {
			search = { 
				_id: mongoose.Types.ObjectId.fromString(req.params.shift_id),
				_member: req.session.member._id
			};
		}

		Shift.findOne(search, function (err, shift) {

			if (req.session.member.account.permissions.schedule
				|| momentIsEditable( moment(shift.start) )) {

				Shift.update(search, {
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
		});
	} else {
		res.json(401, {status: "unauthorized"});
	}
	
};

exports.get_shift = function (req, res) {

	if (req.session.member) {
		var Shift = mongoose.model('Shift');
		Shift.findOne({ _id: mongoose.Types.ObjectId.fromString(req.params.shift_id)}, function (err, item) {
			if (err) {
				res.json(500, {error: err});
			} else {
				res.json(200, item);
			}
		});
	} else {
		res.json(401, {error: 'unauthorized'});
	}
};