(function() {
  var mongoose = require('mongoose');
  var crypto = require('crypto');
  var models = require('./models');
  var pepper = require('./pepper').pepper;

  var DEFAULT_USERNAME = 'admin';
  var DEFAULT_PASSWORD = 'admin';

  mongoose.connect('mongodb://localhost/mcems');
  mongoose.model('Member', new mongoose.Schema(models.member));
  mongoose.model('System', new mongoose.Schema(models.system));

  var Member = mongoose.model('Member');
  var System = mongoose.model('System');

  var member_data = {
    name: {
      first: 'Ben',
      last: 'Burwell'
    },
    unit: 348,
    account: {
      username: DEFAULT_USERNAME,
      password: {},
      email_aliases: 'webmaster',
      created: new Date(1992, 11, 30),
      login_enabled: true,
      permissions: {
        schedule: true,
        members: true,
        accounts: true,
        events: true,
        broadcast: true,
        service_credit: true,
        pages: true
      }
    },
    class_year: 2015,
    campus_box: 2559,
    campus_address: '411 N. 22nd St.',
    home_address: {
      line_1: 'String',
      line_2: 'String',
      city: 'String',
      state: 'String',
      zip: 'String',
      country: 'String'
    },
    school_email: 'bb246500@muhlenberg.edu',
    phone: '6094051361',
    status: {
      executive: '',
      training_corps: false,
      probationary: false,
      emt: true,
      driver_trainee: false,
      driver: true,
      crew_chief_trainee: false,
      crew_chief: true
    }
  };

  crypto.randomBytes(128, function (ex, salt) {

    var s = crypto.createHash('sha1');
    s.update(salt);
    salt = s.digest('hex');

    var password = crypto.createHash('sha1');
    password.update(DEFAULT_PASSWORD);
    password.update(salt);
    password.update(pepper);

    var hash = password.digest('hex');

    member_data.account.password.salt = salt;
    member_data.account.password.hash = hash;

    var m = new Member(member_data);

    m.save(function(err, member) {
      console.log('Bootstrapped initial user admin/admin');
      new System({ property: 'accepting_applications', value: false }).save(function(err) {
        console.log('Set applications as closed');
        new System({ property: 'schedule_message', value: '' }).save(function(err) {
          console.log('Set empty scheduling system message');
          mongoose.disconnect();
        });
      });
    });
  });

})();
