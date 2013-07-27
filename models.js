var mongoose = require('mongoose');

exports.shift = {
	start: Date,
	end: Date,
	name: String,
	unit: Number,
	driver: Boolean,
	probationary: Boolean,
	crew_chief: Boolean,
	training_corps: Boolean,
	_member: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Member'
	}
};

exports.member = {
	name: {
		first: String,
		last: String
	},
	unit: Number,
	join: Date,
	separation: Date,
	account: {
		username: String,
		password: {
			hash: String,
			salt: String,
			reset_key: String,
			reset_key_expiry: Date
		},
		last_login: Date,
		created: Date,
		login_enabled: Boolean,
		permissions: {
			schedule: Boolean,
			site: Boolean,
			files: Boolean,
			members: Boolean,
			accounts: Boolean
		}
	},
	campus_box: String,
	campus_address: String,
	home_address: {
		line_1: String,
		line_2: String,
		city: String,
		state: String,
		zip: String,
		country: String
	},
	phone: String,
	certifications: [{
		type: String,
		number: String,
		issue: Date,
		expiry: Date
	}],
	status: {
		executive: String,
		training_corps: Boolean,
		probationary: Boolean,
		emt: Boolean,
		driver_trainee: Boolean,
		driver: Boolean,
		crew_chief_trainee: Boolean,
		crew_chief: Boolean
	}
};