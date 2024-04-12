var content = [];
var content_buffer = [];
var bottomReached = true;

var infiniteScrollOffset = 200;

function sortBy(selector) {
	// var complete = content.concat(content_buffer);
	content.sort(function(a, b) {
		switch(selector) {
		case "mdatea":
			return a.mdate - b.mdate;
			break;
		case "mdated":
		default:
			return b.mdate - a.mdate;
			break;
		}
       
    });
    $('#scroller').html('');
    loadcontent(content);
}

function loadcontent(list) {
	list.forEach( function(item, index) {
		if (item.type.split('/')[0] == 'image') {
			// if image
			$('#scroller').append($('<img>',{'data-src':'/content/'+item.name}));
		}
		if (item.type.split('/')[0] == 'video') {
			// if video
			var video = $('<video />', {
			    'data-src': '/content/'+item.name,
			    'controls': true
			});
			$('#scroller').append(video);
		}
	});
	$('#scroller').append('<hr>');
}

function ajaxcontent(id) {
	if (bottomReached == true) {
		$.ajax({
			url: '/api/content/'+id,
			type: 'GET',
			success: function(data) {
				content_buffer = data;
				content = content.concat(content_buffer);
				loadcontent(content_buffer);
				bottomReached = false;
			},
			error: function(error) {
				document.getElementById('scroller').innerHTML = `Error ${error}`;
			}
		});
	}
}

// infinite scroller
$(window).scroll(function () { 
	if ((window.innerHeight + Math.ceil(window.pageYOffset)) >= document.body.offsetHeight - infiniteScrollOffset) {
		// get meme with lowest id and forward it to ajax
		if (bottomReached == false) {
			bottomReached = true;
			min = content.reduce(function(previousValue, currentValue, index, array) {
		    	return (currentValue.rowid < previousValue.rowid ? currentValue : previousValue);
			});
			ajaxcontent(min.rowid);
		}
	}
});

window.onload = function() {
	// initial grab of content
	ajaxcontent(9999999);
	setInterval(mediaDataToSrc, 2000);
}

// Basic logger
$(document).ready(function(){
	if (!Cookies.get('logger')) {
		$.post('/logger', { width: screen.width, height: screen.height });
		Cookies.set('logger', 'yes', {expires: 1});
	}
}); 


function mediaDataToSrc() {
	$.each($('img, video'), function() {
        if ( $(this).attr('data-src') && $(this).offset().top < ($(window).scrollTop() + $(window).height() + infiniteScrollOffset) ) {
            var source = $(this).data('src');
            $(this).attr('src', source);
            $(this).removeAttr('data-src');
        }
    });
}

// lazy media loader
$(window).scroll(function() {
    mediaDataToSrc();
});
