$(document).ready(function () {

	$('button.approve').click(function () {
		var id = $(this).attr('data');
		$.post('/members/service-credits/approve/' + id, function (data) {
			location.reload();
		});
	});

	$('button.reject').click(function () {
		var id = $(this).attr('data');
		$.post('/members/service-credits/reject/' + id, function (data) {
			location.reload();
		});
	});

});