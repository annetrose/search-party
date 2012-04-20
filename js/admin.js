function logoutAllStudents() {
	$('#warning').html("<p>Are you sure you want to logout all students?</p>")
	$('#warning').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/admin", {
    			async: false,
    			data: {
    				action: "logoutallstudents"
    			},
    			success: function(data,textStatus,jqXHR) {
    				if (data.trim()=="OK") {
    					if (typeof updateUI == 'function') {
    					   updateUI();
    					}
    				}
    				else {
    					alert(data);
    				}
    			},
    			error: function(jqXHR, textStatus, errorThrown) {
    				alert(textStatus);
    			}
    	    });
          },
		  No: function() {
            $(this).dialog("close");
          }
        }
    });
}

function updateValues() {
	$('#warning').html("<p>Are you sure you want to update values in datastore?</p>")
	$('#warning').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/admin", {
    			async: false,
    			data: {
    				action: "updatevalues"
    			},
    			success: function(data,textStatus,jqXHR) {
    				if (data.trim()=="OK") {
    					if (typeof updateUI == 'function') {
    					   updateUI();
    					}
    				}
    				else {
    					alert(data);
    				}
    			},
    			error: function(jqXHR, textStatus, errorThrown) {
    				alert(textStatus);
    			}
    	    });
          },
		  No: function() {
            $(this).dialog("close");
          }
        }
    });
}