var mongoose, postmark;
var marked = require('marked');
exports._connect = function (m, p) {
	mongoose = m;
	postmark = p;

	marked.setOptions({
		gfm: true,
		tables: true,
		breaks: true,
		pedantic: false,
		sanitize: false,
		smartLists: true,
		smartypants: true
	});
};

exports.index = function (req, res) {
	var Page = mongoose.model('Page');
	var query = { url: 'home' };
	Page.findOne(query, function (err, page) {
		if (page) {
			res.render('page', {
				title: page.title,
				content: marked(page.content),
				description: page.description
			});
		} else {
			res.status(404);
			res.render('404');
		}
	});
};

exports.render = function (req, res) {

	var Page = mongoose.model('Page');

	var query = { url: req.params.page };

	if (!req.session.member) {
		query.public = true;
	}

	Page.findOne(query, function (err, page) {
		if (page) {
			res.render('page', {
				title: page.title,
				content: marked(page.content),
				description: page.description
			});
		} else {
			res.status(404);
			res.render('404');
		}
	});
};

exports.list = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		var Page = mongoose.model('Page');

		Page.find().exec(function (err, pages) {
			res.render('pages/list', {pages: pages});
		});

	} else {
		res.redirect('/');
	}
};

exports.edit_form = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		var Page = mongoose.model('Page');
		var id = mongoose.Types.ObjectId.fromString(req.params.page);
		Page.findOne({_id: id}, function (err, page) {
			res.render('pages/edit', {page: page});
		});

	} else {
		res.redirect('/');
	}
};

exports.edit = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		var Page = mongoose.model('Page');
		var id = mongoose.Types.ObjectId.fromString(req.params.page);
		Page.update({ _id: id }, {
			name: req.body.name,
			show_in_nav: (req.body.show_in_nav == 'true')? true : false,
			public: (req.body.public == 'true')? true : false,
			title: req.body.title,
			description: req.body.description,
			content: req.body.content,
			url: req.body.url,
			last_modified: new Date()
		}, function (err) {
			if (err) console.log(err);
			res.redirect('/pages');
		});

	} else {
		res.redirect('/');
	}
};

exports.create = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		var Page = mongoose.model('Page');
		new Page({
			name: req.body.name,
			show_in_nav: (req.body.show_in_nav == 'true')? true : false,
			public: (req.body.public == 'true')? true : false,
			title: req.body.title,
			description: req.body.description,
			content: req.body.content,
			url: req.body.url,
			last_modified: new Date()
		}).save(function (err) {
			res.redirect('/pages');
		});

	} else {
		res.redirect('/');
	}
};

exports.create_form = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		res.render('pages/create');

	} else {
		res.redirect('/');
	}
};

exports.delete = function (req, res) {
	if (req.session.member
		&& req.session.member.account.permissions.pages) {

		var Page = mongoose.model('Page');
		var id = mongoose.Types.ObjectId.fromString(req.params.page);
		Page.remove({ _id: id}, function (err) {
			res.json(200, {status: 'ok'});
		});

	} else {
		res.redirect('/');
	}
};
