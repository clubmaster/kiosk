cmcl.changePage = function(page) {
    $('#pages').children().addClass('hidden');
    page.removeClass('hidden');
};


cmcl.updateFields = function() {
    var data = cmcl.data.fields[ cmcl.data.bookingdate.toYYYYMMDD() ],
        hourWidth = 115,
        hours = Math.ceil(new Date( new Date(data.info.end_time) - new Date(data.info.start_time) ).getHours());
    
    $('#overflow').children().remove();
    cmcl.data.intervalObjects = {};
    
    $.each(data.fields, function(index, field) {
        var fieldElement = $('<div />', {
            class: "field"
        });
        
        fieldElement.width(hours * hourWidth - hourWidth / 2);
        $('#overflow').append(fieldElement);
        
        
        $.each(field.intervals, function(index, interval) {
            var wrapperElement = $('<div />', {
                class: "interval_wrapper"
            });
            var intervalElement = $('<div />', {
                class: "interval"
            });
            var intervalDelta = new Date( new Date(interval.end_time) - new Date(interval.start_time) ) / 1000 / 3600;
            var startDelta = new Date( new Date(interval.start_time) - new Date(data.info.start_time) ) / 1000 / 3600;
            var formatStart = new Date( interval.start_time).toString('HH:mm');
            var formatEnd = new Date( interval.end_time).toString('HH:mm');
            var button = $('<button>' + field.name + '</button>');
            var past = new Date().compareTo( new Date(interval.start_time)) >= 0;
            var loggedIn = cmcl.data.user !== null;
            var intervalObject = {
                element: intervalElement,
                button: button,
                data: interval
            };
            
            cmcl.data.intervalObjects[interval.start_time + '_' + interval.field] = intervalObject;
            
            button.button( {
                disabled: past || !loggedIn
            });
            button.click( function() {
                cmcl.book(intervalObject);
            });
            
            
            wrapperElement.width(intervalDelta * hourWidth + 'px');
            wrapperElement.css('left', startDelta * hourWidth  + 'px');
            
            fieldElement.append(wrapperElement);
            wrapperElement.append(intervalElement);
            intervalElement.append('<div style="margin:5px;"><span style="float:left;">'+ formatStart +'</span><span style="float:right;">' + formatEnd + '</span></div>');
            intervalElement.append(button);
        });

    });
    
};

cmcl.updateBookings = function() {
    var bookings = cmcl.data.bookings[ cmcl.data.bookingdate.toYYYYMMDD() ];
    
    $.each(bookings, function(index, booking) {
        var type = booking.type; // booking or team
        if(type === 'booking') {
            var fieldId = booking.field_id;
            var startTime = booking.first_date;
            var intervalObject = cmcl.data.intervalObjects[startTime + '_' + fieldId];
            var past = new Date().compareTo( new Date(intervalObject.data.start_time)) >= 0;
            var userBooking = cmcl.data.user && cmcl.data.user.id === booking.user.id && !past;
            
            
            intervalObject.element.addClass(userBooking ? 'book-user' : 'book-normal');
            
            intervalObject.button.button(
                {
                    disabled: !userBooking,
                    label: userBooking ? 'Aflys' : 'Booked'
                }
            );
            
            intervalObject.button.unbind('click');
            intervalObject.button.click( function() {
                cmcl.ajax.cancelBooking(booking.id);
            });
        }
    });
};

cmcl.book = function(intervalObject) {
    var data = intervalObject.data;
    cmcl.data.bookinginterval = data;
    $('#user_search_dialog').dialog('open');
};

cmcl.incrementLoading = function() {
    cmcl.loadingcycles++;
    cmcl.updateLoading();
};

cmcl.decrementLoading = function() {
    cmcl.loadingcycles--;
    cmcl.updateLoading();
};

cmcl.updateLoading = function() {
    if(cmcl.loadingcycles > 0) {
        $("#loadmask").mask();
    } else {
        $("#loadmask").unmask();
    }
};


cmcl.updateBookingButton = function() {
    var user_id = $('#search_results').val();
    if(user_id) {
        $(".ui-dialog-buttonpane button:contains('Book Bane')").button("enable");
    } else {
        $(".ui-dialog-buttonpane button:contains('Book Bane')").button("disable");
    }
};

cmcl.resize = function() {
    var body = $('body');
    var width = body.width();
    var height = body.height();
    var scaleY = height / 1200;
    var scaleX = width / 1920;
    var bgScale = scaleX > scaleY ? scaleX : scaleY;
    
    $('#bgimage').css('-webkit-transform', 'scale(' + bgScale + ', ' + bgScale + ')');
    $('#bgimage').css('-webkit-transform-origin', '0% 0%');
};

(function() {

//  $('#button_booking').click(function() {
//      cmcl.changePage( $('#page_booking') );
//  });
  
  $('#button_login').click(function() {
      $('#login_dialog').dialog('open');
  });
  
  $('#button_logout').click(function() {
      cmcl.data.user = null;
      $('#button_logout').hide();
      $('#button_login').show();
      cmcl.updateFields();
      cmcl.updateBookings();
  });
  
  $('#search_results').click(function() {
      cmcl.updateBookingButton();
  });
  
  window.onresize = cmcl.resize;
  
  // Fetch initial data from server.
  cmcl.ajax.getUsers();
   
  // Fetch initial fields data from server.
  cmcl.ajax.getFields(cmcl.data.location_id, cmcl.data.bookingdate );
  
  cmcl.resize();
})();