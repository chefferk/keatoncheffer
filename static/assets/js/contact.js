
var lang;

jQuery.getJSON(lang_path, function(data) {
	lang = data;
});

(function($) {

	$('.contact-form').each(function(index) {

		var $form        = $(this),
		    $msg         = $form.find('.alert'),
		    $submitBtn	 = $form.find('button[type=submit]');

		// Handle Form Submit
		$form.submit(function(e) {
			// prevent form submit
			e.preventDefault();

			// Prevent double submission by disabling the submit button
			$submitBtn.html($submitBtn.data('sending')).attr('disabled', 'disabled');

			// Hide previous messages
			$msg.fadeOut(0);

			// Validate the Form Data
			var validate = validateForm($form);
			if (!validate.success)
			{
				if (validate.errors.length > 0)
				{
					showMessage($msg, errorsArrayToHtml(validate.errors), 'alert-danger');
			    	// Re-enable submit button
			    	$submitBtn.html($submitBtn.data('text')).removeAttr('disabled');
			    	return null;
			    }
			}

			if (typeof(grecaptcha) != 'undefined' && $form.find('.g-recaptcha').length > 0 && $form.find('.g-recaptcha').hasClass('invisible'))
			{
				if(!grecaptcha.execute($form.find('.g-recaptcha').data('grecaptcha')))
				{
					// Re-enable submit button
					$submitBtn.html($submitBtn.data('text')).removeAttr('disabled');
					return null;
				}
			}
			else {
				// If reCAPTCHA V2 is enabled, check also if is checked
				if (typeof(grecaptcha) != 'undefined' && $form.find('.g-recaptcha').length > 0 && !$form.find('.g-recaptcha').hasClass('invisible'))
				{
					if (grecaptcha.getResponse($form.find('.g-recaptcha').data('grecaptcha')) == "")
					{
						showMessage($msg, lang.recaptcha.empty, 'alert-danger');
						// Re-enable submit button
						$submitBtn.html($submitBtn.data('text')).removeAttr('disabled');
						return null;
					}
				}

				submitAjaxForm($form);
			}
		});

		$submitBtn.attr('data-text', $submitBtn.html());
	});
}(jQuery));

/* Functions */

/* Validate a form */
function validateForm($form)
{
	var $msg = $form.find('.alert'),
		errors = [],
		success = true;

	// Loop through fields
	$form.find('.form-control').each(function(index) {
		var err = validateField(jQuery(this));
		if(err != null) { errors.push(err); }
	});

	// Check if there're errors
	if (errors.length > 0) {
		success = false;
	}

	return {success:success, errors:errors};
}

/* Validate a single field */
function validateField($field)
{
	var type = $field.prop('type'),
	    displayName = $field.data('displayname'),
	    value  = $field.val(),
	    msg = null;

	// Check if is required
	if($field.prop('required') && $field.val() === '') {
		msg = paramsIntoString(lang.required_field, [displayName]);
		return msg;
	}
	else if($field.val() === '') {
		return null;
	}

	// Check the type
	switch(type) {
		case 'email':
			var atIndex = value.indexOf("@"),
			    dotIndex = value.lastIndexOf(".");

			if (atIndex < 1 || dotIndex < 1 || dotIndex < atIndex || dotIndex >= value.length ) {
				msg = paramsIntoString(lang.email_invalid, [displayName]);
				return msg;
			}
			break;
	}

	return null;
}

/* Replace params into string */
function paramsIntoString(string, params)
{
	var i;
	for (i = 0; i < params.length; i++) {
		string = string.replace("{{" + (i+1) + "}}", params[i]);
	}
	return string;
}

/* Create html from errors array */
function errorsArrayToHtml(errors)
{
	var resultHtml = "";

	for (var i = 0; i < errors.length; i++) {
		resultHtml += errors[i] + "<br />";
	}

	return resultHtml;
}

/* Show Form Messages */
function showMessage($msg, html, type)
{
	$msg.html(html).removeClass('alert-success alert-danger').addClass(type).fadeIn(400);
}

/* Reset a Form */
function resetForm($form, time)
{
	var time_anim = time > 0 ? 400 : 0;

	$form[0].reset();
	if(typeof(grecaptcha) != 'undefined' && $form.find('.g-recaptcha').length > 0) {
		grecaptcha.reset($form.find('.g-recaptcha').data('grecaptcha'));
	}
	setTimeout(function() {
		$form.find('.alert').fadeOut(time_anim).html('').removeClass('error success');
	}, time);
}

/* Google reCAPTCHA functions  */
function initRecaptchas()
{
	jQuery('.contact-form .g-recaptcha').each(function(index) {
		var thisElem = jQuery(this)[0];
		var sitekey = jQuery(this).data('sitekey');

		if(jQuery(this).hasClass('invisible')) {
	        jQuery(this).data('grecaptcha',
				grecaptcha.render(thisElem, {
	        		'sitekey': sitekey,
	        		'badge': 'inline',
	        		'size': 'invisible',
	        		'callback': 'callbackRecaptcha'
	        	})
	        );
	    }
	    else {
			jQuery(this).data('grecaptcha',
				grecaptcha.render(thisElem, {
	        		'sitekey': sitekey,
	        		'theme': 'light',
	        		'size': 'normal'
	        	})
	        );
	    }
	});
}
function callbackRecaptcha(token)
{
	var $recaptcha = null;
	jQuery('.g-recaptcha-response').each(function(index) {
		if(jQuery(this).val() == token) {
			$recaptcha = jQuery(this);
		}
		return ($recaptcha == null);
	});

	if($recaptcha != null) {
		submitAjaxForm($recaptcha.closest('form'));
	}
}

/* Submit the Form */
function submitAjaxForm($form)
{
	var $msg 		 = $form.find('.alert'),
	    $submitBtn	 = $form.find('button[type=submit]'),
	    submitBtnTxt = $submitBtn.data('text'),
	    action 		 = $form.prop('action'),
		formData;

	// Prevent double submission by disabling the submit button
	$submitBtn.html($submitBtn.data('sending')).attr('disabled', 'disabled');

	formData = new FormData($form[0]);
	// Send informations
	jQuery.ajax({
		url: action,
		type: 'POST',
		dataType: 'json',
		data: formData,
		processData: false,
		contentType: false,
		success: function(data)
        {
			if(data.errors) {
				// Show errors
				showMessage($msg, errorsArrayToHtml(data.errors), 'alert-danger');
	            // Re-enable submit button
				$submitBtn.html(submitBtnTxt).removeAttr('disabled');
				return null;
			}
			else if(data.success) {
				// Show success message
				showMessage($msg, data.success, 'alert-success');
				resetForm($form, 6000);
				// Re-enable submit button
				$submitBtn.html(submitBtnTxt).removeAttr('disabled');
			}
			else if(data.redirectUrl) {
				window.location.href = data.redirectUrl;
			}
			else {
				window.location.reload();
			}
        },
        error: function(data)
        {
        	// Something went wrong
			showMessage($msg, lang.something_wrong, 'alert-danger');
			if(typeof(grecaptcha) != 'undefined' && $form.find('.g-recaptcha').length > 0) {
				grecaptcha.reset($form.find('.g-recaptcha').data('grecaptcha'));
			}
			// Re-enable submit button
			$submitBtn.html(submitBtnTxt).removeAttr('disabled');
        }
	});
}
