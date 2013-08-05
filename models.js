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
			accounts: Boolean,
			events: Boolean,
			broadcast: Boolean,
			service_credit: Boolean
		}
	},
	class_year: Number,
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
	school_email: String,
	phone: String,
	status: {
		executive: String,
		training_corps: Boolean,
		probationary: Boolean,
		emt: Boolean,
		driver_trainee: Boolean,
		driver: Boolean,
		crew_chief_trainee: Boolean,
		crew_chief: Boolean
	},
	emails: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Email' }],
	certifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certification' }],
	service_credits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCredit' }]
};

exports.certification = {
	type: String,
	issue: Date,
	expiry: Date,
	number: String,
	_member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' }
};

exports.email = {
	address: String,
	mobile: {
		carrier: String,
		number: String
	},
	_member: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Member'
	},
	confirmed: Boolean,
	confirm_code: Number
}

exports.service_credit = {
	_member: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Member'
	},
	_approver: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Member'
	},
	description: String,
	request_date: Date,
	credit_date: Date,
	approved: Boolean
};

exports.event = {
	title: String,
	type: {
		type: String,
		enum: ['Medical', 'PR']
	},
	link: String
};

exports.system = {
	property: String,
	value: String
};