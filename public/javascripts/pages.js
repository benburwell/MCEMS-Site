$(document).ready(function () {
	$('#deletePage').click(function () {
		if (confirm("Are you sure you want to completely delete this page forever?")) {
			var id = $(this).attr('data');
			$.post('/pages/delete/' + id, function () {
				window.location.href = '/pages';
			});
		}
		return false;
	});
});