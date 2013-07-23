var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
	return;
}

exports.shifts = function (req, res) {
	var model = mongoose.model('Shift');
	model.find(function (err, items, count) {
		res.json(200, items);
	});
};

exports.members = function (req, res) {
	var model = mongoose.model('Member');
	model.find(function (err, items, count) {
		res.json(200, items);
	});
};

exports.users = function (req, res) {
	var model = mongoose.model('User');
	model.find(function (err, items, count) {
		res.json(200, items);
	});
};
