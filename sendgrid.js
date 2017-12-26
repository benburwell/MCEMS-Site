var sendgridClientStub = {
  setApiKey: function(key) {
    // stub -- do nothing
  },
  send: function(msg) {
    return new Promise(function(resolve, reject) {
      console.log('-----SENDGRID API-----');
      console.log(JSON.stringify(msg));
      console.log('-----END SENDGRID API-----');
      resolve();
    });
  },
};

var sg = (
  (process.env.NODE_ENV === 'production') ?
  require('@sendgrid/mail') : sendgridClientStub
);
sg.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
    send: function(msg, done) {
        if (typeof msg === 'object') {
            msg.from = 'webmaster@bergems.org';
        }
        if (Array.isArray(msg)) {
            msg.forEach(function (m) {
                m.from = 'webmaster@bergems.org';
            });
        }
        sg.send(msg).then(function() {
            console.log('Message sent!');
            done();
        }).catch(function(err) {
            console.error('Error sending message', err);
            console.error(err.response.body);
            done(err.toString());
        });
    }
}
