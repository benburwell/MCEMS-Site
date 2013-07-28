$(document).ready(function () {
	$('.danger').on('click', function () {
		$.post('/events/delete/' + $(this).attr('data'), function (res) {
			location.reload();
		});
	});
});