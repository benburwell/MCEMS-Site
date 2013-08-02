$(document).ready(function () {

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

	$('#home_state').val($('#member_home_state').text());
});