var loadCerts = function () {

	var id = $('#member_id').text();

	// show loading message
	$('#certificationContainer').text('Loading...');

	// get the JSON feed
	$.getJSON('/members/certifications/' + id + '.json', function (certs) {

		// clear loading message
		$('#certificationContainer').text('');

		// display certs
		certs.forEach(function (cert) {

			var html = '<div class="certification" data="' + cert._id + '">'
				+ '<p><b>Type:</b> ' + cert.type + '</p>'
				+ '<p><b>Number:</b> ' + cert.number + '</p>';

			if (cert.issue) {
				html += '<p><b>Issued:</b> ' + moment(cert.issue).format('MMMM D YYYY') + '</p>';
			}

			if (cert.expiry) {
				html += '<p><b>Expires:</b> ' + moment(cert.expiry).format('MMMM D YYYY') + '</p>';
			}
			
			html += '</div>';

			$('#certificationContainer').append(html);
		});

		$('.certification').on('click', function () {
			if (confirm("Delete certification?")) {
				$.post('/members/certifications/delete', {
					id: $(this).attr('data')
				}, function () {
					loadCerts(id);
				});
			}
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
					loadCerts(id);
				});
			}
		}
	});

	$('#addNewCertification').on('click', function () {
		$('#addCertificationDialog').dialog('open');
	});

	$('#home_state').val($('#member_home_state').text());

	loadCerts(id);

});