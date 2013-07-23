exports.shifts = function (mongoose) {
	return function (req, res) {
		var model = mongoose.model('Shift');
		model.find(function (err, items, count) {
			res.json(200, items);
		});
	};
};

exports.members = function (mongoose) {
	return function (req, res) {
		var model = mongoose.model('Member');
		model.find(function (err, items, count) {
			res.json(200, items);
		});
	};
};

exports.users = function (mongoose) {
	return function (req, res) {
		var model = mongoose.model('User');
		model.find(function (err, items, count) {
			res.json(200, items);
		});
	};
};