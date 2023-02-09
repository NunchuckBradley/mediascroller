var memes = [];
var meme_buffer = [];
var bottomReached = true;

var infiniteScrollOffset = 200;

function sortBy(selector) {
	// var complete = memes.concat(meme_buffer);
	memes.sort(function(a, b) {
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
    loadMemes(memes);
}

function loadMemes(list) {
	list.forEach( function(item, index) {
		if (item.type.split('/')[0] == 'image') {
			// if image
			$('#scroller').append($('<img>',{'data-src':'/memes/'+item.name}));
		}
		if (item.type.split('/')[0] == 'video') {
			// if video
			var video = $('<video />', {
			    'data-src': '/memes/'+item.name,
			    'controls': true
			});
			$('#scroller').append(video);
		}
	});
	$('#scroller').append('<hr>');
}

function ajaxMemes(id) {
	if (bottomReached == true) {
		$.ajax({
			url: '/api/memes/'+id,
			type: 'GET',
			success: function(data) {
				meme_buffer = data;
				memes = memes.concat(meme_buffer);
				loadMemes(meme_buffer);
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
			min = memes.reduce(function(previousValue, currentValue, index, array) {
		    	return (currentValue.rowid < previousValue.rowid ? currentValue : previousValue);
			});
			ajaxMemes(min.rowid);
		}
	}
});

window.onload = function() {
	// initial grab of memes
	ajaxMemes(9999999);
	setInterval(mediaDataToSrc, 2000);
}

// Logger to log you chipmunks 😈
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