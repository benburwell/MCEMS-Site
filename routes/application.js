var moment = require('moment');
var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
};

exports.form = function (req, res) {
	var System = mongoose.model('System');
	System.findOne( { property: 'accepting_applications' },
		function (err, property) {
			if (property) {
				var showForm = (property.value == 'true')? true : false;
				res.render('applicants/apply', {showForm: showForm});
			} else {
				res.render('applicants/apply', {showForm: false});
			}
		});
};

exports.submit = function (req, res) {
	var Applicant = mongoose.model('Applicant');

	var interview = mongoose.Types.ObjectId.fromString(req.body.interview);

	new Applicant({
		name: {
			first: req.body.first_name,
			last: req.body.last_name
		},
		berg_id: req.body.berg_id,
		class_year: req.body.class_year,
		campus_address: req.body.campus_address,
		campus_box: req.body.campus_box,
		school_email: req.body.school_email,
		phone: req.body.phone,
		emt: {
			number: req.body.emt_number,
			state: req.body.emt_state,
			expiry: new Date(req.body.emt_expiration)
		},
		cpr: {
			expiry: new Date(req.body.cpr_expiration)
		},
		drivers_license: {
			number: req.body.driver_number,
			state: req.body.driver_state,
			expiry: new Date(req.body.driver_expiration)
		},
		member_of_other_ems_org: req.body.member_of_other_ems_org,
		hep_b_date1: new Date(req.body.hep_b_date1),
		hep_b_date2: new Date(req.body.hep_b_date2),
		hep_b_date3: new Date(req.body.hep_b_date3),
		reference1: {
			name: req.body.ref1_name,
			relation: req.body.ref1_relation,
			phone: req.body.ref1_phone
		},
		reference2: {
			name: req.body.ref2_name,
			relation: req.body.ref2_relation,
			phone: req.body.ref2_phone
		},
		consent_records_check: (req.body.consent_records_check == 'Yes')? true : false,
		convicted_of_crimes: req.body.convicted_of_crimes,
		other_activities: req.body.other_activities,
		why_join: req.body.why_join,
		other_certs: req.body.other_certs,
		additional_comments: req.body.additional_comments,
		_interview: interview
	}).save(function (err) {
		var Interview = mongoose.model('Interview');
		Interview.update({_id: interview}, {available:false}, function (err) {
			res.render('applicants/thanks');
		});
	});
};

exports.list_applicants = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {
			var Applicant = mongoose.model('Applicant');
			Applicant
				.find()
				.populate('_interview')
				.exec(function (err, applicants) {
					res.render('applicants/list', {applicants: applicants, moment: moment});
			});
	} else {
		res.redirect('/');
	}
};

exports.display_applicant = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Applicant = mongoose.model('Applicant');
			var id = mongoose.Types.ObjectId.fromString(req.params.id);

			Applicant
				.findOne({_id:id})
				.populate('_interview')
				.exec(function (err, applicant) {
					res.render('applicants/edit', {applicant: applicant, moment: moment});
				});
	} else {
		res.redirect('/');
	}
};

exports.update_applicant = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Applicant = mongoose.model('Applicant');
			var id = mongoose.Types.ObjectId.fromString(req.params.id);
			Applicant.update({ _id: id }, {
				interview_notes: req.body.interview_notes
			}, function (err) {
				res.redirect('/applicants');
			});
	} else {
		res.redirect('/');
	}
};

exports.migration_form = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Applicant = mongoose.model('Applicant');
			var id = mongoose.Types.ObjectId.fromString(req.params.id);
			Applicant.findOne({_id: id}, function (err, applicant) {
				res.render('applicants/migrate', {applicant: applicant});
			});

	} else {
		res.redirect('/');
	}
};

exports.delete_applicant = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Applicant = mongoose.model('Applicant');
			var id = mongoose.Types.ObjectId.fromString(req.params.id);

			Applicant.remove({_id: id}, function (err) {
				res.redirect('/applicants');
			});
	} else {
		res.redirect('/');
	}
};

exports.interview_slots_json = function (req, res) {
	var Interview = mongoose.model('Interview');
	Interview
		.find()
		.select('time _id available')
		.exec(function (err, slots) {
			res.json(200, slots)
		});
};

exports.create_interview_slot = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Interview = mongoose.model('Interview');
			new Interview({
				time: new Date(req.body.time),
				available: true
			}).save(function (err) {
				res.json(200, {status: 'done'});
			});
	} else {
		res.redirect('/');
	}
};

exports.delete_interview_slot = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {

			var Interview = mongoose.model('Interview');
			var id = mongoose.Types.ObjectId.fromString(req.params.id);
			Interview.remove({ _id: id}, function (err) {
				res.json(200, {status: 'done'});
			});
			
	} else {
		res.redirect('/');
	}
};

exports.open_applications = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {
			var System = mongoose.model('System');

			System.findOne(
				{property: 'accepting_applications'},
				function (err, property) {
					if (property) {
						System.update(
							{ property: 'accepting_applications' },
							{ value: 'true' },
							function (err) {
								res.json(200, {status:'done'});
							});
					} else {
						new System({
							property: 'accepting_applications',
							value: 'true'
						}).save(function (err) {
							res.json(200, {status:'done'});
						});
					}
				});
	} else {
		res.json(403, {status:'403'});
	}
};

exports.close_applications = function (req, res) {
	if (req.session.member &&
		req.session.member.account.permissions.members) {
			var System = mongoose.model('System');
			System.update(
				{ property: 'accepting_applications' },
				{ value: 'false' },
				function (err) {
					res.json(200, {status:'done'});
				});
	} else {
		res.json(403, {status:'403'});
	}
};
