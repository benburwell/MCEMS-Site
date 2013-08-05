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
	model.find().populate('service_credits emails certifications').exec(function (err, items, count) {
		res.json(200, items);
	});
};