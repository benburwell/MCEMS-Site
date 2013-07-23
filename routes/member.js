var mongoose;

var mongoose, postmark;
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;
	return;
}

exports.list = function (req, res) {
	var Member = mongoose.model('Member');
	Member.find(function (err, members, count) {
		if (err) {
			return res.json(500, {error: err});
		} else {
			return res.render('members/list', {members: members});
		}
	});
};

exports.create_form = function (req, res) {
	res.render('members/create');
};

exports.create = function (req, res) {
	var Member = mongoose.model('Member');
	new Member({
		name: {
			first: req.body.first_name,
			last: req.body.last_name
		},
		unit: req.body.unit,
		probationary: (req.body.probationary == 'true')? true : false,
		driver: (req.body.driver == 'true')? true : false,
		crew_chief: (req.body.crew_chief == 'true')? true : false
	}).save(function (err, member, count) {

		if (err) {
			console.log(err);
		}

		return res.redirect('/members');
	});
};

exports.edit_form = function (req, res) {
	var Member = mongoose.model('Member');
	Member.findOne({ _id: mongoose.Types.ObjectId.fromString(req.params.member) }, function (err, item) {
		if (err) {
			return res.json(404, {error: 'No such member'});
		} else {
			return res.render('members/edit', {member: item});
		}
	});
};

exports.edit = function (req, res) {
	var Member = mongoose.model('Member');
	Member.update(
		{ _id: mongoose.Types.ObjectId.fromString(req.params.member) },
		{
			name: {
				first: req.body.first_name,
				last: req.body.last_name
			},
			unit: req.body.unit,
			probationary: (req.body.probationary == 'true')? true : false,
			driver: (req.body.driver == 'true')? true : false,
			crew_chief: (req.body.crew_chief == 'true')? true : false
		},
		function (err, count) {
			res.redirect('/members');
		}
	);
};

exports.delete = function (req, res) {
	var Member = mongoose.model('Member');
	Member.remove({ _id: mongoose.Types.ObjectId.fromString(req.params.member) }, function (err) {
		res.redirect('/members');
	});
};