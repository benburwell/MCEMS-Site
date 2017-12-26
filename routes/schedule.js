var moment = require('moment');
var icalendar = require('icalendar');
var sendgrid = require('../sendgrid');

var mongoose;
exports._connect = function (m) {
	mongoose = m;
	return;
}

var beginEditingForMoment = function (m) {

	if (m.month() == 7) {
		return moment(m)
			.date(1)
			.hour(0)
			.minute(0)
			.second(0);
	}

	return moment(m)
		.subtract('months', 1)
		.date(15)
		.hour(0)
		.minute(0)
		.second(0);
};

var endEditingForMoment = function (m) {

	if (m.month() == 7) {
		return moment(m)
			.date(15)
			.hour(23)
			.minute(59)
			.second(59);
	}

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
		.startOf('month')
		.year(req.params.year)
		.month(req.params.month-1);

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

	var start_date = moment(now).startOf('month').toDate();
	var end_date = moment(now).endOf('month').toDate();

	console.log(start_date);
	console.log(end_date);

	Shift.find({
		"start": {
			"$gte": start_date,
			"$lte": end_date
		}
	}).sort({start: 'ascending'}).exec(function (err, shifts, count) {

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
		Member
			.find()
			.sort('name.last')
			.sort('name.first')
			.exec(function (err, members) {

			var System = mongoose.model('System');
			System.findOne({property: 'schedule_message'}, function (err, msg) {
				return res.render(view, {
					days: days,
					month: now.format('MMMM'),
					year: now.format('YYYY'),
					prev_month: {
						name: prev_month.format('MMMM'),
						url: '/schedule/' + prev_month.format('YYYY/MM')
					},
					next_month: {
						name: next_month.format('MMMM'),
						url: '/schedule/' + next_month.format('YYYY/MM')
					},
					members: members,
					message: msg.value
				});
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
				var id = mongoose.Types.ObjectId(req.body.member);

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
						_member: member._id,
						added_on: new Date(),
						added_by: req.session.member.name.first + ' ' + req.session.member.name.last,
						modified_on: new Date(),
						modified_by: req.session.member.name.first + ' ' + req.session.member.name.last
					};

					new Shift(data).save(function (err) {
						var s = moment(req.body.start).format('HH:mm [on] MMMM Do YYYY');
						var e = moment(req.body.end).format('HH:mm [on] MMMM Do YYYY');
						sendgrid.send({
							to: member.school_email,
							subject: 'Shift Signup Confirmation',
							text: 'Hi ' + member.name.first + ', \n\n'
								+ 'This email is to confirm that you have signed up '
								+ 'for a shift starting from ' + s + ' until ' + e + '.\n\n'
								+ 'If this is incorrect, please log on to the website and change '
								+ 'your shift. If you need assistance, please contact the calendar '
								+ 'administrator for help.'
							}, function (err) {
								res.json(200, {status: 'ok'});
							});
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
					_member: req.session.member._id,
					added_on: new Date(),
					added_by: req.session.member.name.first + ' ' + req.session.member.name.last,
					modified_on: new Date(),
					modified_by: req.session.member.name.first + ' ' + req.session.member.name.last
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
				_id: mongoose.Types.ObjectId(req.params.shift_id)
			}).remove(function (err) {
				res.json(200, {status: 'complete'});
			});
		} else {
			Shift.findOne({
				_id: mongoose.Types.ObjectId(req.params.shift_id),
				_member: req.session.member._id
			}, function (err, shift) {

				if (momentIsEditable( moment(shift.start) )) {
					Shift.remove({
						_id: mongoose.Types.ObjectId(req.params.shift_id),
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
				_id: mongoose.Types.ObjectId(req.params.shift_id)
			};
		} else {
			search = { 
				_id: mongoose.Types.ObjectId(req.params.shift_id),
				_member: req.session.member._id
			};
		}

		Shift.findOne(search, function (err, shift) {

			if (req.session.member.account.permissions.schedule
				|| momentIsEditable( moment(shift.start) )) {

				Shift.update(search, {
					start: new Date(req.body.start),
					end: new Date(req.body.end),
					modified_on: new Date(),
					modified_by: req.session.member.name.first + ' ' + req.session.member.name.last
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
		Shift.findOne({ _id: mongoose.Types.ObjectId(req.params.shift_id)}, function (err, item) {
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

exports.edit_message = function (req, res) {

	if (req.session.member) {
		if (req.session.member.account.permissions.schedule) {

			var System = mongoose.model('System');
			System.update(
				{property: 'schedule_message'},
				{value: req.body.message},
				function (err) {
					res.redirect('/schedule');
				});

		} else {
			res.redirect('/schedule');
		}
	} else {
		res.redirect('/');
	}
};

exports.member_shifts = function (req, res) {

	if (req.session.member) {

		var id = mongoose.Types.ObjectId(req.params.member);
		if (req.session.member.account.permissions.members
			|| req.session.member.account.permissions.accounts
			|| req.session.member._id == id) {

				var Shift = mongoose.model('Shift');
				Shift.find({
					_member: id,
					start: {
						"$gte": new Date()
					}
				}, function (err, shifts) {
					res.json(200, shifts);
				});

		} else {
			res.json(403, {});
		}

	} else {
		res.json(403, {});
	}
};

exports.member_hours_json = function (req, res) {

	if (req.session.member) {

		var id = mongoose.Types.ObjectId(req.params.member);
		if (req.session.member.account.permissions.members
			|| req.session.member.account.permissions.accounts
			|| req.session.member._id == id) {

				var Shift = mongoose.model('Shift');
				var start, end;
				var query;

				if (req.query.sy && req.query.sm && req.query.sd) {
					start = new Date(req.query.sy, +req.query.sm - 1, req.query.sd);
				} else if (req.query.start) {
					start = new Date(req.query.start);
				}

				if (req.query.ey && req.query.em && req.query.ed) {
					end = new Date(req.query.ey, +req.query.em - 1, req.query.ed);
				} else if (req.query.end) {
					end = new Date(req.query.end);
				}

				if (end) {
					end = moment(end).endOf('day').toDate();
				}

				if (start && end) {
					query = {
						_member: id,
						start: {
							$lte: end
						},
						end: {
							$gte: start
						}
					};
				} else if (start) {
					query = {
						_member: id,
						end: {
							$gte: start
						}
					};
				} else if (end) {
					query = {
						_member: id,
						start: {
							$gte: end
						}
					};
				} else {
					query = { _member: id };
				}

				Shift.find(query, function (err, shifts) {
					
					var hours = 0;

					shifts.forEach(function (shift) {
						
						var s = moment(shift.start);
						var e = moment(shift.end);

						if (start) {
							if (moment(start).isAfter(s)) {
								s = moment(start);
							}
						}

						if (end) {
							if (moment(end).isBefore(e)) {
								e = moment(end);
							}
						}

						var diff = e.diff(s, "hours", true);

						hours += diff;
					});

					var data = {
						hours: Math.round(hours * 10) / 10
					}

					res.json(200, data);
				});

		} else {
			res.json(403, {});
		}

	} else {
		res.json(403, {});
	}

};

exports.future_shift_ics = function (req, res) {

	if (req.session.member) {

		var member = mongoose.Types.ObjectId(req.params.member);
		var id = mongoose.Types.ObjectId(req.params.id);

		if (req.session.member.account.permissions.members
			|| req.session.member.account.permissions.accounts
			|| req.session.member._id == member) {

				var Shift = mongoose.model('Shift');
				Shift.findOne({
					_member: member,
					_id: id
				}, function (err, shift) {

					res.type('ics');

					var event = "BEGIN:VCALENDAR\n"
						+ "METHOD:REQUEST\n"
						+ "BEGIN:VEVENT\n"
						+ "DTSTART:" + moment(shift.start).format("YYYYMMDD")
						+ 'T'
						+ moment(shift.start).format("HHmmss") + "\n"
						+ "DTEND:" + moment(shift.end).format("YYYYMMDD")
						+ 'T'
						+ moment(shift.end).format("HHmmss") + "\n"
						+ "SUMMARY:MCEMS Duty\n"
						+ "END:VEVENT\n"
						+ "END:VCALENDAR";

					res.send(event);

				});

		} else {
			res.json(403);
		}

	} else {
		res.json(403);
	}

}

// Show semester totals for hours
exports.duty_report = function (req, res) {

	if (req.session.member &&
		(req.session.member.account.permissions.members
			|| req.session.member.account.permissions.schedule)) {

		var Member = mongoose.model('Member');

		Member.find().sort('name.last').exec(function (err, members) {
			if (err) {
				res.render('error', {
					title: 'Database Error',
					message: 'The system experienced an internal error. Please try again shortly.'
				});
			}

			res.render('schedule/duty_report', {
				members: members
			});
		});

	} else {
		res.render('error', {
			title: 'Not Authorized',
			message: 'Please log in to view reports.'
		});
	}

};

exports.duty_ics = function (req, res) {
	var Shift = mongoose.model('Shift');

	var start = moment().subtract('months', 3).toDate();
	var end = moment().add('months', 3).toDate();

	Shift.find({
		start: { $gte: start },
		end: { $lte: end }
	}, function (err, result) {

		if (err || result == null) {
			return res.json(500, {error: 'server error'});
		}
		
		var ical = new icalendar.iCalendar();
		var e;

		for (var i = 0; i < result.length; i++) {
			e = ical.addComponent('VEVENT');
			e.setSummary(result[i].name + ' ' + result[i].unit);
			e.setDescription('Description');
			e.setDate(result[i].start, result[i].end);
		}

		res.type('ics');

		res.send(ical.toString());
	});
};
