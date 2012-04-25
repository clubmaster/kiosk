cmcl = { };
cmcl.loadingcycles = 0;
cmcl.ajax = {
    base: 'http://demo.clubmaster.dk/api/'
};
cmcl.booking = {};

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


cmcl.start = function() {
    cmcl.attachListeners();
    cmcl.initJQueryWidgets();

    cmcl.booking.initialize();

    // Setup page by doing an initial resize.
    cmcl.onresize();

    var timeout = 30000;
    $(document).bind("idle.idleTimer", function(){
      cmcl.data.user = null;
      $('#button_logout').hide();
      $('#button_login').show();
      cmcl.booking.updateFields();
      cmcl.booking.updateBookings();
    });
    $.idleTimer(timeout);
};


Date.prototype.toYYYYMMDD = function() {
    return this.toString('yyyy-MM-dd');
};


cmcl.onresize = function() {
    var body = $('body');
    var width = body.width();
    var height = body.height();
    var scaleY = height / 1200;
    var scaleX = width / 1920;
    var bgScale = scaleX > scaleY ? scaleX : scaleY;

    $('#bgimage').css('-webkit-transform', 'scale(' + bgScale + ', ' + bgScale + ')');
    $('#bgimage').css('-webkit-transform-origin', '0% 0%');
};


cmcl.attachListeners = function() {
    $('#button_login').click(function() {
        $('#login_dialog').dialog('open');
    });

    $('#button_logout').click(function() {
        cmcl.data.user = null;
        $('#button_logout').hide();
        $('#button_login').show();
        cmcl.booking.updateFields();
        cmcl.booking.updateBookings();
    });

    $('#search_results').click(function() {
        cmcl.booking.updateDialogButton();
    });

    $('#refresh_image').click(function() {
        location.reload();
    });

    window.onresize = cmcl.onresize;
};


cmcl.initJQueryWidgets = function() {
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
                                var fullname = user.first_name + ' ' + user.last_name+' ('+user.member_number+')';
                                if(regExp.test(fullname)) {
                                    $('#search_results').append('<option value="' + user.id + '">' + fullname + '</option>');
                                } else if (search == user.member_number) {
                                    $('#search_results').append('<option value="' + user.id + '">' + fullname + '</option>');
                                };
                            });
                        }
                        cmcl.booking.updateDialogButton();
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
                cmcl.booking.updateDialogButton();
            },
            close: function() {
                $('#input_search').val('');
                $('#search_results').children().remove();
                cmcl.booking.updateDialogButton();
            }
        }
    );
    $('#interval_dialog').dialog(
        {
            autoOpen: false,
            modal: true,
            position: 'top',
            resizable: false,
            draggable: false,
            buttons: {
                "Log ind": function() {
                    $('#login_dialog').dialog('open');
                },
            },
        }
    );
    $('#booking_dialog').dialog(
        {
            autoOpen: false,
            modal: true,
            position: 'top',
            resizable: false,
            draggable: false,
            buttons: {
                "Find medlem": function() {
                    $('#user_search_dialog').dialog('open');
                },
                "Book med gæst": function() {
                    var date = cmcl.data.bookingdate;
                    var interval_id = cmcl.data.bookinginterval.id;

                    cmcl.ajax.bookFieldGuest(date, interval_id);
                },
                "Slet": function() {
                    var booking_id = cmcl.data.bookinginterval.booking.id;
                    cmcl.ajax.cancelBooking(booking_id);
                },
            },
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
};

// Update intervals, so that users can't press old bookings. Do this every 5 minutes.
setInterval(function() {
   cmcl.booking.updateFields();
   cmcl.booking.updateBookings();
}, 5*60*1000);
