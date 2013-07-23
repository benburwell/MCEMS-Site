$(document).ready(function () {

	// set up edit dialog
	$('#edit_shift').dialog({
		height: 500,
		width: 400,
		autoOpen: false,
		modal: true,
		buttons: {
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
					),
					name: $('#edit_name').val(),
					unit: $('#edit_unit').val(),
					crew_chief: $('#edit_crew_chief').is(':checked'),
					driver: $('#edit_driver').is(':checked'),
					probationary: $('#edit_probationary').is(':checked')
				};

				$.post(url, data).done(function () {
					location.reload();
				});
			},
			"Remove": function () {

				$('#edit_shift').find('input').attr('disabled', 'disabled');
				$('#edit_shift').find('select').attr('disabled', 'disabled');

				$.post('/schedule/shift/delete/' + $('#edit_shift').attr('data'))
					.done(function () {
						location.reload();
					}
				);
			}
		}
	});

	// set up add dialog
	$('#add_shift').dialog({
		height: 500,
		width: 400,
		autoOpen: false,
		modal: true,
		buttons: {
			"Add Shift": function () {
				
				$('#add_shift').find('input').attr('disabled', 'disabled');
				$('#add_shift').find('select').attr('disabled', 'disabled');

				var url = '/schedule';
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
					name: $('#name').val(),
					unit: $('#unit').val(),
					crew_chief: $('#crew_chief').is(':checked'),
					driver: $('#driver').is(':checked'),
					probationary: $('#probationary').is(':checked')
				};

				$.post(url, data).done(function () {
					location.reload();
				});
			}
		}
	});

	// add shift popup on click
	$('.calendar td').not('.null').on('click', function () {
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
	$('table.calendar .shift .name').on('click', function (e) {

		e.stopPropagation();

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

			$('#edit_name').val(shift.name);
			$('#edit_unit').val(shift.unit);

			if (shift.probationary) {
				$('#edit_probationary').attr('checked', 'checked');
			}

			if (shift.driver) {
				$('#edit_driver').attr('checked', 'checked');
			}

			if (shift.crew_chief) {
				$('#edit_crew_chief').attr('checked', 'checked');
			}

			// finished loading, enable editing
			$('#edit_shift').find('input').removeAttr('disabled');
			$('#edit_shift').find('select').removeAttr('disabled');
		});
		
	});

});