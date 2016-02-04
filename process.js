jQuery(document).ready(function($) {
	if(typeof db == 'object'){
		$.each(db,function(data, val) {
			$('#type').append($('<option>', { 
        		value: data,
        		text : data 
    		}));
		});

		/*On type/change event*/
		$("#text").on('change, keyup',update_result);
		$("#type").change(update_result);

	} else error("Data missing",501);	
});

function update_result(){
	language = $('#type').val();
	result = '';
	
	$.each(
		$('#text').val().split(''),
		function(data,val){
			if (val == ' ' || val == '\n') result += '<br/>';
			else {
				ltr = db[language][val.toUpperCase()];
				ltr = (ltr == undefined) ? val : ltr; 
				result += "<span>" + ltr + "</span>";
			}
		} 
	);

	$('.result').html(result);
}

function error(error_message, error_code){
	alert("Sorry! There is some problem with the application, please try later");
	report = 	"Error:" + error_message;
	report +=	"Error Code" + error_code;
	email(report);
	return;
}

function email(){
	/* Your email api call,
	I usually use mailgun to handle this. */
	return false;
}

