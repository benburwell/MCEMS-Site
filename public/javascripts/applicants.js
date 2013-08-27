$(document).ready(function () {

	$('.datepicker').datepicker();

	$('.interview').hide();
	$('.detailed_questions').hide();

	$('#close_applications').click(function () {
		$.post('/applicants/close', function (response) {
			alert('Applications have been closed');
		});
	});

	$('#open_applications').click(function () {
		$.post('/applicants/open', function (response) {
			alert('Applications have been opened');
		});
	});

	$('#detailedQuestions').click(function () {
		$('.demographics').hide();
		$('.detailed_questions').show();
	});

	$('#pickInterview').click(function () {
		$('.interview').show();
		$('.detailed_questions').hide();
		loadOpenSlots();
	});

	$('.delete_applicant').click(function () {
		if (confirm("Are you sure you want to permanently lose all of this applicant's information?")) {
			$.post('/applicants/delete/' + $(this).attr('data'), function (data) {
				window.location.href = '/applicants';
			});
		} else {
			return false;
		}
	})

	var loadOpenSlots = function () {
		$('#interview_time').text('');
		$.getJSON('/applicants/interview-slots.json', function (data) {
			var id = $('#interview_id').text();
			data.forEach(function (slot) {
				if (slot.available) {
					var html = '<option value="'
						+ slot._id
						+ '"';
					if (id == slot.id) {
						html += ' selected="selected"';
					}

					html += '>'
						+ moment(slot.time).format('MMMM D [at] h:mm a')
						+ '</option>';

					$('#interview_time').append(html);
				}
			});
		});
	};

	loadOpenSlots();

	var loadSlots = function () {
		$('#slots').text('');
		$.getJSON('/applicants/interview-slots.json', function (slots) {
			slots.forEach(function (slot) {

				var html;

				if (slot.available) {
					html = '<p style="color:#090;">';
				} else {
					html = '<p>';
				}

				html += moment(slot.time).format('MMMM D HH:mm') 
					+ ' <a class="delete_slot button danger" data="' + slot._id + '">'
					+ 'Delete</a></p>';

				$('#slots').append(html);
			});

			$('.delete_slot').click(function () {
				var id = $(this).attr('data');
				var url = '/applicants/interview-slots/delete/' + id;
				$.post(url, function () {
					loadSlots();
				});
			});
		});
	};

	$('#addSlot').click(function () {
		$('#add_slot').dialog('open');
	});

	$('#showInterviewSlots').click(function () {
		$('#interview_slots').dialog('open');
	});

	$('#interview_slots').dialog({
		modal: true,
		autoOpen: false,
		width: 400,
		open: loadSlots
	});

	$('#add_slot').dialog({
		modal: true,
		autoOpen: false,
		width: 500,
		open: function () {
			$('#add_slot_date').val('');
			$('#add_slot_hour').val('0');
			$('#add_slot_minute').val('0');
		},
		buttons: {
			"Add": function () {

				var date = $('#add_slot_date').val();
				var hour = $('#add_slot_hour').val();
				var minute = $('#add_slot_minute').val();
				var time = moment(date).hour(hour).minute(minute).toDate();

				$.post('/applicants/interview-slots', {
					time: time
				}, function () {
					loadSlots();
					$('#add_slot').dialog('close');
				});
			}
		}
	})

});