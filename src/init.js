cmcl = {};
cmcl.loadingcycles = 0;
cmcl.ajax = {
    base: 'http://demo.clubmaster.dk/api/'
};

cmcl.keysbound = false;

cmcl.data = {
    location_id: 1,
    user: null,
    users: null,
    fields: {},
    bookings: {},
    bookingdate: new Date(),
    bookinginterval: null,
    intervalObjects: []
};

cmcl.getAffectedInterval = function(fieldId, inStartTime, inEndTime) {
    var intervalObjects = cmcl.data.intervalObjects;
    var foundElements = [];

    $.each(intervalObjects, function(index, intervalObject) {
        var data = intervalObject.data;
        var startTime = new Date(data.start_time);
        var endTime = new Date(data.end_time);
        
        if(data.field == fieldId) {
            if( 
               (inStartTime.compareTo(startTime) <= 0 && inEndTime.compareTo(endTime) >= 0) ||
               (startTime.compareTo(inStartTime) == -1 && endTime.compareTo(inStartTime) == 1) ||
               (startTime.compareTo(inEndTime) == -1 && endTime.compareTo(inEndTime) == 1)
            ) {
                foundElements.push(intervalObject);
            }
        }
    });
    
    return foundElements;
};


Date.prototype.toYYYYMMDD = function() {
    return this.toString('yyyy-MM-dd');
};

// Setup virtual keyboard.
$('input.key').keyboard(
    {
        layout: 'danish-qwerty',
        autoAccept: true,
        position: {
            of : $('app'),
            my : 'center bottom',
            at : 'center bottom'
        },
        usePreview: false,
        visible: function(e, keyboard, el) {
            if( !cmcl.keysbound &&  $('#input_search')[0] === el ) {
                
                $("#input_search").getkeyboard().$allKeys.click( function() {
                    var search = $('#input_search').val(),
                        regExp = new RegExp(search, 'i');
                      
                    $('#search_results').children().remove();
                    if(search) {
                        $.each(cmcl.data.users, function(index, user) {
                            var fullname = user.first_name + ' ' + user.last_name;
                            if(regExp.test(fullname)) { 
                                $('#search_results').append('<option value="' + user.id + '">' + fullname + '</option>');
                            };
                        }); 
                    }  
                    cmcl.updateBookingButton();
                });
                cmcl.keysbound = true;
            }
        }
    }
);

$('input:submit, button').button();
$('#button_logout').hide();

$("#booking_date_picker").datepicker(
    {
        dateFormat: 'yy-mm-dd',
        minDate: 0,
        onSelect: function(dateString) {
            var date = new Date(dateString);
            cmcl.data.bookingdate = date;
            cmcl.ajax.getFields(cmcl.data.location_id, date);
        }
    }
);
$("#booking_date_picker").datepicker( "setDate" , cmcl.data.bookingdate );

// Setup dialogs.
$('#login_dialog').dialog(
    {
        autoOpen: false,
        modal: true,
        position: 'top',
        resizable: false,
        draggable: false,
        buttons: {
            "Login": function() {
                cmcl.ajax.login( $('#input_username').val(), $('#input_password').val() );
            },
            "Annuller": function() {
                $('#login_dialog').dialog('close');
            }
        },
        close: function() {
            $('#input_username').val('');
            $('#input_password').val('');
            $('#login_dialog_error').text('');
        }
    }
);
$('#user_search_dialog').dialog(
    {
        autoOpen: false,
        modal: true,
        position: 'top',
        resizable: false,
        draggable: false,
        buttons: {
            "Book Bane": function() {
                var date = cmcl.data.bookingdate;
                var user_id = $('#search_results').val();
                var interval_id = cmcl.data.bookinginterval.id;

                cmcl.ajax.bookField(date, interval_id, user_id);
            },
            "Annuller": function() {
                $('#user_search_dialog').dialog('close');
            }
        },
        open: function() {
            cmcl.updateBookingButton();
        },
        close: function() {
            $('#input_search').val('');
            $('#search_results').children().remove();
            cmcl.updateBookingButton();
        }
    }
);
$('#error_dialog').dialog(
    {
        autoOpen: false,
        modal: true,
        position: 'top',
        resizable: false,
        draggable: false
    }
);


// Update intervals, so that users can't press old bookings. Do this every 5 minutes.
setInterval(function() {
   cmcl.updateFields(); 
   cmcl.updateBookings();
}, 5*60*1000);
