$(document).ready(function () {

	// set up edit dialog
	$('#edit_shift').dialog({
		autoOpen: false,
		modal: true,
		width: 400,
		buttons: {
			"Remove": function () {

				$('#edit_shift').find('input').attr('disabled', 'disabled');
				$('#edit_shift').find('select').attr('disabled', 'disabled');

				$.post('/schedule/shift/delete/' + $('#edit_shift').attr('data'))
					.done(function () {
						location.reload();
					}
				);
			},
			"Save": function () {

				$('#edit_shift').find('input').attr('disabled', 'disabled');
				$('#edit_shift').find('select').attr('disabled', 'disabled');

				var url = '/schedule/shift/' + $('#edit_shift').attr('data');
				var data = {
					start: new Date(
						$('#edit_start_month').val()
						+ $('#edit_start_day').val()
						+ ' '
						+ $('#display_year').text()
						+ ' '
						+ $('#edit_start_hour').val()
						+ ':'
						+ $('#edit_start_minute').val()
					),
					end: new Date(
						$('#edit_end_month').val()
						+ $('#edit_end_day').val()
						+ ' '
						+ $('#display_year').text()
						+ ' '
						+ $('#edit_end_hour').val()
						+ ':'
						+ $('#edit_end_minute').val()
					)
				};

				$.post(url, data).done(function () {
					location.reload();
				});
			}
		}
	});

	// set up add dialog
	$('#add_shift').dialog({
		autoOpen: false,
		modal: true,
		width: 400,
		buttons: {
			"Add Shift": function () {
				
				$('#add_shift').find('input').attr('disabled', 'disabled');
				$('#add_shift').find('select').attr('disabled', 'disabled');

				var data = {
					start: new Date(
						$('#start_month').text()
						+ $('#start_day').text()
						+ ' '
						+ $('#display_year').text()
						+ ' '
						+ $('#start_hour').val()
						+ ':'
						+ $('#start_minute').val()
					),
					end: new Date(
						$('#end_month').val()
						+ $('#end_day').val()
						+ ' '
						+ $('#display_year').text()
						+ ' '
						+ $('#end_hour').val()
						+ ':'
						+ $('#end_minute').val()
					),
					member: null
				};

				if ($('#member_to_add').val() != undefined) {
					data.member = $('#member_to_add').val();
				}

				$.post('/schedule', data).done(function () {
					location.reload();
				});
			}
		}
	});

	// add shift popup on click
	$('.calendar td.editable').on('click', function () {
		var date = $(this).children('.date').first().text();
		$('#add_shift').dialog('open');

		var thisMonth = $('#display_month').text();
		var thisYear = $('#display_year').text();

		var today = moment(thisMonth + ' ' + date + ', ' + thisYear);

		$('#start_month').text(today.format('MMMM')+' ');
		$('#start_day').text(today.format('D'));
		$('#start_hour').val('17');

		var tomorrow = moment(today).add('days', 1);

		$('#end_month').val(tomorrow.format('MMMM'));
		$('#end_day').val(tomorrow.format('D'));

		if (tomorrow.day() == 6 || tomorrow.day() == 0) {
			$('#end_hour').val(17);
		} else {
			$('#end_hour').val(8);
		}
	});

	// edit shift popup on click
	$('table.calendar td.editable .shift.editable .name').on('click', function (e) {

		e.stopPropagation();
		$(this).focus();

		// set data for delete
		var id = $(this).attr('data');

		$('#edit_shift').attr('data', id);		
		$('#edit_shift').dialog('open');

		// while JSON is loading, disable inputs
		$('#edit_shift').find('input').attr('disabled', 'disabled');
		$('#edit_shift').find('select').attr('disabled', 'disabled');

		// fetch shift data
		$.getJSON('/shift/' + id, function (shift) {

			var shift_start = moment(shift.start);
			var shift_end = moment(shift.end);

			$('#edit_start_month').val(shift_start.format('MMMM'));
			$('#edit_start_day').val(shift_start.format('D'));
			$('#edit_start_hour').val(shift_start.format('H'));
			$('#edit_start_minute').val(shift_start.format('mm'));

			$('#edit_end_month').val(shift_end.format('MMMM'));
			$('#edit_end_day').val(shift_end.format('D'));
			$('#edit_end_hour').val(shift_end.format('H'));
			$('#edit_end_minute').val(shift_end.format('mm'));

			if (shift.added_by && shift.added_on) {
				$('#added_by').text(shift.added_by);
				$('#added_on').text(moment(shift.added_on).format('MMMM D, YYYY [at] HH:mm'));
			} else {
				$('#added_by').text('unknown user');
				$('#added_on').text('unknown time');
			}
			
			if (shift.modified_by && shift.modified_on) {
				$('#modified_by').text(shift.modified_by);
				$('#modified_on').text(moment(shift.modified_on).format('MMMM D, YYYY [at] HH:mm'));
			} else {
				$('#modified_by').text('unknown user');
				$('#modified_on').text('unknown time');
			}

			// finished loading, enable editing
			$('#edit_shift').find('input').removeAttr('disabled');
			$('#edit_shift').find('select').removeAttr('disabled');
		});
		
	});
	
	var editingMessage = false;

	$('#message.editable').on('click', function (e) {

		if (!editingMessage) {
			editingMessage = true;
			$('#message').html(
				'<input id="updated_message" type="text" value="'
				+ $('#message').text()
				+ '"> '
				+ '<button class="button" '
				+ 'type="button" id="update_message">Save</button>'
				);

				$('#updated_message').focus();

			$('#update_message').on('click', function () {

				$('#updated_message').attr('disabled', 'disabled');
				$('#update_message').attr('disabled', 'disabled');

				$.post('/schedule/message', {
					message: $('#updated_message').val()
				}).done(function () {
					$('#message').html($('#updated_message').val());
					editingMessage = false;
				});
			});
		}
	});
});
