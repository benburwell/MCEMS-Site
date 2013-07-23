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
					member: []
				},
				incomplete: false,
				in_month: false
			}
		} else if (i - month_start < days_in_month) {
			day = {
				number: i - month_start + 1,
				shifts: {
					crew_chief: [],
					member: []
				},
				incomplete: false,
				in_month: true
			}
		} else {
			day = {
				number: "",
				shifts: {
					crew_chief: [],
					member: []
				},
				incomplete: false,
				in_month: false
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
				crew_chief: shift.crew_chief
			};

			if (shift.crew_chief) {
				var n = month_start + moment(shift.start).date() - 1;
				days[n].shifts.crew_chief.push(s);
			} else {
				var n = month_start + moment(shift.start).date() - 1;
				days[n].shifts.member.push(s);
			}
		});

		return res.render('schedule/schedule', {
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

	var Shift = mongoose.model('Shift');

	new Shift({
		start: new Date(req.body.start),
		end: new Date(req.body.end),
		name: req.body.name,
		unit: req.body.unit,
		crew_chief: (req.body.crew_chief == 'true')? true : false,
		probationary: (req.body.probationary == 'true')? true : false,
		driver: (req.body.driver == 'true')? true : false,
		_member: null
	}).save(function (err, shift, count) {
		res.redirect('/schedule');
	});
};

exports.delete_shift = function (req, res) {
	var Shift = mongoose.model('Shift');
	Shift.findOne({
		_id: mongoose.Types.ObjectId.fromString(req.params.shift_id)
	}).remove();

	res.json(200, {status: "complete"});
};

exports.update_shift = function (req, res) {
	var Shift = mongoose.model('Shift');
	Shift.update(
		{ _id: mongoose.Types.ObjectId.fromString(req.params.shift_id) },
		{
			start: new Date(req.body.start),
			end: new Date(req.body.end),
			name: req.body.name,
			unit: req.body.unit,
			driver: (req.body.driver == 'true')? true : false,
			probationary: (req.body.probationary == 'true')? true : false,
			crew_chief: (req.body.crew_chief == 'true')? true : false,
			_member: null
		},
		function (err, count) {
			if (err) {
				res.json(500, {status: "error"});
			} else {
				res.json(200, {status: "success"});
			}
		}
	);
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