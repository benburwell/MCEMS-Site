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

			var expiring = cert.expiry && moment(cert.expiry).diff(moment(), 'days') < 60;

			var html = '<div class="item certification';

			if (expiring) {
				html += ' expiring';
			}

			html += '" data="' + cert._id + '">'
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

			var html = '<div class="item email '
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
			var html = '<div class="item credit ';

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
		width: 300,
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

	$('#hoursInRangeDialog').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: function() {
			$('#hour_range_start').val('');
			$('#hour_range_end').val('');
		}
	});

	$('#hour_range_start').datepicker();
	$('#hour_range_end').datepicker();

	var getHoursForRange = function () {
		var url = '/members/stats/' + id + '.json?start='
			+ $('#hour_range_start').val()
			+ '&end=' + $('#hour_range_end').val();
		$.getJSON(url, function (data) {
			$('#result_hours').text(data.hours);
		});
	};

	$('#hour_range_start').bind('change paste keyup', getHoursForRange);
	$('#hour_range_start').bind('change paste keyup', getHoursForRange);

	$('#getHoursForRange').click(function () {
		$('#hoursInRangeDialog').dialog('open');
	});

	$('#deleteMember').click(function () {
		if (confirm("Do you really want to delete this member forever?")) {
			var id = $('#member_id').text();
			$.post('/members/delete/' + id, {}, function (data) {
				window.location.href = '/members';
			});
		}
	});

	$('#saveMember').click(function () {
		$('#memberDetailForm').submit();
	});

	loadCerts();
	loadEmails();
	loadServiceCredits();

	if (id) {
		$.getJSON('/members/shifts/' + id + '.json', function (shifts) {

	        
			shifts.forEach(function (shift) {
	            
				var html = '<div class="item">'
	                + '<p><a class="pill button calendar icon" '
	                + 'style="float:right;" '
	                + 'href="/schedule/ical/' + id + '/' + shift._id + '.ics">'
	                + 'iCal</a></p>'
					+ '<p><b>' + moment(shift.start).format('MMMM Do') + '</b></p>'
					+ '<p>' + moment(shift.start).format('HH:mm') + '&ndash;'
				    + moment(shift.end).format('HH:mm') + '</p>'
	                + '</div>';
				$('#shiftContainer').append(html);
			});

		});

	    $.getJSON('/members/stats/' + id + '.json', function (stats) {
	        $('#allTimeHours').text(stats.hours);
	    });

	    var m1 = moment();
	    var m2 = moment().subtract('months', 1);
	    var m3 = moment().subtract('months', 2);

	    var base = '/members/stats/' + id + '.json';

	    var m1q = base + '?sy=' + m1.format('YYYY')
	    	+ '&sm=' + m1.format('MM')
	    	+ '&sd=01'
	    	+ '&ey=' + m1.format('YYYY')
	    	+ '&em=' + m1.format('MM')
	    	+ '&ed=' + m1.endOf('month').format('DD');

	    var m2q = base + '?sy=' + m2.format('YYYY')
	    	+ '&sm=' + m2.format('MM')
	    	+ '&sd=01'
	    	+ '&ey=' + m2.format('YYYY')
	    	+ '&em=' + m2.format('MM')
	    	+ '&ed=' + m2.endOf('month').format('DD');

	    var m3q = base + '?sy=' + m3.format('YYYY')
	    	+ '&sm=' + m3.format('MM')
	    	+ '&sd=01'
	    	+ '&ey=' + m3.format('YYYY')
	    	+ '&em=' + m3.format('MM')
	    	+ '&ed=' + m3.endOf('month').format('DD');

	    $.getJSON(m1q, function (stats) {
	    	$('#m1hours').text(stats.hours);
	    });

	    $.getJSON(m2q, function (stats) {
	    	$('#m2hours').text(stats.hours);
	    });

	    $.getJSON(m3q, function (stats) {
	    	$('#m3hours').text(stats.hours);
	    });
	}

});