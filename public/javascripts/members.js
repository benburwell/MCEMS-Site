var loadCerts = function (id) {

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
				+ '<p><b>Number:</b> ' + cert.number + '</p>'
				+ '<p><b>Issued:</b> ' + moment(cert.issue).format('MMMM DD YYYY') + '</p>'
				+ '<p><b>Expires:</b> ' + moment(cert.expiry).format('MMMM DD YYYY') + '</p>'
				+ '</div>';

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

	var url = document.location.toString();
	var id = url.substring(url.lastIndexOf('/') + 1);

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

		var url = document.location.toString();
		var id = url.substring(url.lastIndexOf('/') + 1);
		
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
		buttons: {
			"Save": function () {
				$.post('/members/certifications/create', {
					type: $('#certificationType').val(),
					issue: new Date($('#issueDate').val()),
					expiry: new Date($('#expiryDate').val()),
					number: $('#certificationNumber').val(),
					member: id
				}, function (data) {
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