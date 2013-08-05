var loadCerts = function () {

	var id = $('#member_id').text();

	if (id == '') return;

	// show loading message
	$('#certificationContainer').text('Loading...');

	// get the JSON feed
	$.getJSON('/members/certifications/' + id + '.json', function (certs) {

		// clear loading message
		$('#certificationContainer').text('');

		// display certs
		certs.forEach(function (cert) {

			var html = '<div class="certification" data="' + cert._id + '">'
				+ '<p><b>' + cert.type + '</b></p>';

			if (cert.number) {
				html += '<p><i>Number:</i> ' + cert.number + '</p>';
			}

			if (cert.issue) {
				html += '<p><i>Issued:</i> ' + moment(cert.issue).format('MMMM D YYYY') + '</p>';
			}

			if (cert.expiry) {
				html += '<p><i>Expires:</i> ' + moment(cert.expiry).format('MMMM D YYYY') + '</p>';
			}
			
			html += '</div>';

			$('#certificationContainer').append(html);
		});

		$('.editable .certification').on('click', function () {
			if (confirm("Delete certification?")) {
				$.post('/members/certifications/delete', {
					id: $(this).attr('data')
				}, function () {
					loadCerts();
				});
			}
		});
	});
};

var loadEmails = function () {

	var id = $('#member_id').text();

	if (id == '') return;

	// show loading message
	$('#emailContainer').text('Loading...');

	// get the JSON feed
	$.getJSON('/members/emails/' + id + '.json', function (emails) {

		// clear loading message
		$('#emailContainer').text('');

		// display emails
		emails.forEach(function (email) {

			var html = '<div class="email '
				+ (email.confirmed? 'confirmed' : 'unconfirmed')
				+ '" data="' + email._id + '">';

			if (email.mobile) {
				html += '<p>' + email.mobile.number + ' (' + email.mobile.carrier + ')</p>';
			} else {
				html += '<p>' + email.address + '</p>';
			}
			
			html += '</div>';

			$('#emailContainer').append(html);
		});

		$('.editable .email').on('click', function () {
			$('#editEmailDialog').attr('data', $(this).attr('data'));
			$('#editEmailDialog').dialog('open');
		});
	});
};

var loadServiceCredits = function () {
	var id = $('#member_id').text();

	if (id == '') return;

	$('#serviceCreditContainer').text('Loading...');
	$.getJSON('/members/service-credits/' + id + '.json', function (credits) {
		$('#serviceCreditContainer').text('');
		credits.forEach(function (credit) {
			var html = '<div class="credit ';

			if (credit.approved) {
				html += 'approved">';
			} else {
				html += 'unapproved">';
			}

			html += '<p>' + credit.description + '</p>';

			if (credit.approved) {
				html += '<p><i>Approved by '
					+ credit._approver.name.first
					+ ' '
					+ credit._approver.name.last
					+ '</i></p>';
			}

			html += '</div>';

			$('#serviceCreditContainer').append(html);
		});
	});
};

$(document).ready(function () {

	var id = $('#member_id').text();

	$('#reset_password_dialog').dialog({
		modal: true,
		autoOpen: false,
		buttons: {
			"OK": function () {
				$(this).dialog('close');
			}
		}
	});

	$('#resetPassword').on('click', function () {

		$('#reset_password_dialog').dialog('open');
		$('#reset_password_dialog .status').text('Resetting...');

		var id = $('#member_id').text();
		var reset = '/members/reset_password/' + id;

		$.post(reset, function (data) {
			if (data.status != 'ok') {
				$('#reset_password_dialog .status').text('Error: ' + data.status);
			} else {
				$('#reset_password_dialog .status').text('New Password: ' + data.plaintext);
			}
		}, "json");

	});

	$('#issueDate').datepicker();
	$('#expiryDate').datepicker();

	$('#addCertificationDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function () {
			$('#certificationNumber').val('');
			$('#issueDate').val('');
			$('#expiryDate').val('');
		},
		buttons: {
			"Save": function () {

				var data = {
					type: $('#certificationType').val(),
					number: $('#certificationNumber').val(),
					member: id
				};

				if ($('#issueDate').val() != '') {
					data.issue = new Date($('#issueDate').val());
				}

				if ($('#expiryDate').val() != '') {
					data.expiry = new Date($('#expiryDate').val());
				}

				$.post('/members/certifications/create', data, function (data) {
					$('#addCertificationDialog').dialog('close');
					loadCerts();
				});
			}
		}
	});

	$('#addNewCertification').on('click', function () {
		$('#addCertificationDialog').dialog('open');
	});

	$('#home_state').val($('#member_home_state').text());

	$('#addEmailDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function () {
			$('#emailAddress').val('');
		},
		buttons: {
			"Add": function () {
				var data = {
					address: $('#emailAddress').val()
				};

				$.post('/members/emails/create', data, function (data) {
					$('#addEmailDialog').dialog('close');
					loadEmails();
				});
			}
		}
	});

	$('#addMobileDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function () {
			$('#mobileNumber').val('');
		},
		buttons: {
			"Add": function () {
				var data = {
					carrier: $('#carrier').val(),
					number: $('#mobileNumber').val()
				};

				$.post('/members/emails/create', data, function (data) {
					$('#addMobileDialog').dialog('close');
					loadEmails();
				});
			}
		}
	});

	$('#editEmailDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function () {
			$('#confirmationCode').val('');
		},
		buttons: {
			"Remove": function () {
				$.post('/members/emails/delete', {
					id: $(this).attr('data')
				}, function () {
					$('#editEmailDialog').dialog('close');
					loadEmails();
				});
			},
			"Confirm": function () {
				$.post('/members/emails/confirm', {
					id: $(this).attr('data'),
					code: $('#confirmationCode').val()
				}, function () {
					$('#editEmailDialog').dialog('close');
					loadEmails();
				});
			}
		}
	})

	$('#showAddEmailDialog').click(function () {
		$('#addEmailDialog').dialog('open');
	});

	$('#showAddMobileDialog').click(function () {
		$('#addMobileDialog').dialog('open');
	});

	$('#addServiceCreditDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function () {
			$('#serviceCreditDescription').val('');
			$('#serviceCreditDate').val('');
		},
		buttons: {
			"Submit": function () {
				$.post('/members/service-credits', {
					date: moment($('#serviceCreditDate').val()).toDate(),
					description: $('#serviceCreditDescription').val()
				}, function () {
					$('#addServiceCreditDialog').dialog('close');
					loadServiceCredits();
				});
			}
		}
	});

	$('#showAddServiceCreditDialog').click(function () {
		$('#addServiceCreditDialog').dialog('open');
	});

	$('#serviceCreditDate').datepicker();

	loadCerts();
	loadEmails();
	loadServiceCredits();

});