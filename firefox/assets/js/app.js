//= require mvpready-core.js
//= require mvpready-admin.js
var rootURI = ''

$.urlParam = function(name){
		var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
		if (results==null){
			 return null;
		}
		else{
			 return results[1] || 0;
		}
}

function callAjaxSuccess(json, callback) { 

	if (callback) {
		eval(callback +'(json);');
	}

	if (json.message) {
		var msg 
		if (json.code == 'success') {
			msg = $('#templateMessage .alert-success').clone();
		} else {
			msg = $('#templateMessage .alert-danger').clone();
		}
		$('span', msg).text(json.message);
		$('#blockMessages').text('');
		msg.appendTo('#blockMessages');
	}

	if (json.redirectURL) {
		location.href = json.redirectURL;
	}
}

function callAjaxError(status, targetURL) { 
	if (status == '403' || status == '404' || status == '405') {
		location.href = rootURI + 'errors/notFound?'+$.param({targetURL:targetURL});
	} else if (status == '500') {
		location.href = rootURI + 'errors/serverError?'+$.param({targetURL:targetURL});
	}
}

function ajaxPostJson(targetURL, data, callback) {

	var jqxhr = $.ajax({
		type: 'POST',
		data: JSON.stringify(data),
		url: targetURL,
		contentType: 'application/json; charset=utf-8',
		dataType: 'json'
	});
	jqxhr.done(function(data) {
		callAjaxSuccess(data, callback);
	}).fail(function(jqXHR) {
		callAjaxError(jqXHR.status, targetURL);
	});
}

function bindAjaxForm() {

	$('.parsley-form').ajaxForm({
		type: 'POST',
		dataType: 'json',
		beforeSubmit: function(arr, $form, options) {

			if ($form.data('submit-handler')) {
				eval($form.data('submit-handler') +'(arr);');
				return false;
			}
			if ($form.data('submitted')) {
				return false;
			}
			$form.data('submitted', true);
		},
		success: function(responseText, statusText, xhr, $form) {
			$form.data('submitted', false);
			var callback = $form.attr('data-handler');
			callAjaxSuccess(responseText, callback);
		},
		error: function(responseText, statusText, xhr, $form) {
			$form.data('submitted', false);
			callAjaxError(responseText.status, $form.attr('action'));
		}
	});
}

$(function(){

	if ($.urlParam('targetURL')) {
		var targetURL = decodeURIComponent($.urlParam('targetURL'));
		$('#hiddenTargetURL').val(targetURL);
		window.history.replaceState('string', '404', targetURL);
	}

	//bindAjaxForm()
	
	$('body').on('click', '.ajax-post-action', function(e) {
		var callback = $(this).attr('data-handler')
		var targetURL = $(this).attr('data-action')
		var jqxhr = $.post(targetURL)
		jqxhr.done(function(data) {
			callAjaxSuccess(data, callback)
		}).fail(function(jqXHR) {
			callAjaxError(jqXHR.status, targetURL)
		})
		return false
	})

	$('body').on('click', '.list-name', function(e) {
		var details = $(this).closest('.list-group-item').find('.list-details')
		var list = $(this).closest('ul')

		if (details.hasClass('hidden')) {
			if (list.hasClass('job-list')) {
				$('.list-details').addClass('hidden')
			}
			details.removeClass('hidden')
		} else {
			details.addClass('hidden')
		}
	})
})