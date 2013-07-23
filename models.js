var mongoose;
exports._connect = function (m) {
	mongoose = m;
	return;
};

exports.shift = {
	start: Date,
	end: Date,
	name: String,
	unit: Number,
	driver: Boolean,
	probationary: Boolean,
	crew_chief: Boolean,
	_member: { type: mongoose.Types.ObjectId, ref: 'Member' }
};

exports.member = {
	name: {
		first: String,
		last: String
	},
	unit: Number,
	probationary: Boolean,
	driver: Boolean,
	crew_chief: Boolean,
	shifts: [ { type: mongoose.Types.ObjectId, ref: 'Shift' } ]
};

exports.user = {
	username: String,
	password: String,
	last_login: Date,
	_member: { type: mongoose.Types.ObjectId, ref: 'Member' },
	email: String,
	permissions: {
		schedule: {
			view: Boolean,
			edit: Boolean
		},
		users: {
			view: Boolean,
			edit: Boolean
		},
		members: {
			view: Boolean,
			edit: Boolean
		}
	}
};