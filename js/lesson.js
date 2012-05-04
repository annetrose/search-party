var VIEW_ALL_LESSONS = '#1';
var CREATE_LESSON = '#2';

var NEW_TASK_FORM_DESIGN = false;
var MAX_NUM_TASKS = 10;

function getLesson(lessonCode) {
	var lesson = null;
	for( var i=0,l=g_lessons.length; i<l; i++ ) {
		var _lesson = g_lessons[i];
		if( _lesson.lesson_code==lessonCode ) {
			lesson = _lesson;
			break;
		}
	}
	return lesson;
}

function createLessonList() {
    var activeHtml = '';
    var inactiveHtml = '';
    for (var i=0; i<g_lessons.length; i++) {
       var lesson = g_lessons[i];
       var html = getLessonHtml(lesson);
       if (lesson.is_active) {
          activeHtml += html;
       }
       else {           
          inactiveHtml += html;
       }
    }    
                    
    $('#lessons_list_active').accordion('destroy');
    $('#lessons_list_inactive').accordion('destroy');
      
    var html = '<div id="lessons_list_active" class="accordion2">'+activeHtml+'</div>';
    html += '<br/>';
    html += '<h3>Stopped Activities</h3>';
    html += '<div id="lessons_list_inactive" class="accordion2">'+inactiveHtml+'</div>';  
    
    $('#content_title').html('Activities');
    $('#content').html(html); 
        
    if (activeHtml) {
       $('#lessons_list_active').accordion({
          collapsible: true, 
          active: false
       });
    }
    else {
        $('#lessons_list_active').html('(none)');
    }
        
    if (inactiveHtml) {
       $('#lessons_list_inactive').accordion({
          collapsible: true, 
          active: false
       });
    }
    else {
        $('#lessons_list_inactive').html('(none)');
    }
}

function getLessonHtml(lesson) {
	var lessonCode = lesson.lesson_code;
    var html = '<h3 id="'+lessonCode+'"><div class="right" style="margin-top:5px;margin-right:5px;"> #'+lessonCode+'</div><a href="#" style="margin:0px;">'+lesson.title+'</a></h3>'
    html += '<div>';
    if (lesson.class_name) {
        html += '<h5>'+lesson.class_name + '</h5>';
    }
    if (lesson.description) {
       html += '<p class="lesson_description">'+lesson.description + '</p>';
    }
    
    html += '<h5 class="task_label">Tasks</h5>';
    html += '<ol>';
    $.each(lesson.tasks, function(i, task) {
        var taskTitle = task[0];
        var taskDescription = task[1];
        html += '<li>'+(i+1)+'. '+taskTitle+'</li>';
    });
    html += '</ol>';

    html += '<div style="margin-top:8px">';
    html += '<button id="view_lesson_btn_'+lessonCode+'" onclick="viewLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">View Activity</button>';
    if (lesson.is_active) {
        html += '<button id="stop_lesson_btn_'+lessonCode+'" onclick="stopLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">Stop Activity</button>';
    }
    else {
        html += '<button id="start_lesson_btn_'+lessonCode+'" onclick="startLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">Start Activity</button>';
    }
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html += '<button id="clear_data_btn_'+lessonCode+'" onclick="clearLesson(\'' + lessonCode + '\', true);" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">Clear Data</button>';
    html += '<button id="download_data_btn_'+lessonCode+'" onclick="window.location=\'/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes+'\'; return false;" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">Download Data</button>';
    html += '<button id="delete_lesson_btn_'+lessonCode+'" onclick="deleteLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-bottom:6px; margin-right:6px">Delete Activity</button>';
    html += '</div>';
    
//    html += '<div style="margin-top:8px; float:left">'
//    html += '<div class="cssbtnlabel smallest" style="width:55px; float:left; margin-right:5px;">Activity:</div>';
//    html += '<button id="view_lesson_btn_'+lessonCode+'" onclick="viewLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-right:6px">View</button>';
//    if (lesson.is_active) {
//        html += '<button id="stop_lesson_btn_'+lessonCode+'" onclick="stopLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-right:6px">Stop</button>';
//    }
//    else {
//  	  html += '<button id="start_lesson_btn_'+lessonCode+'" onclick="startLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-right:6px">Start</button>';
//    }
//    html += '<button id="delete_lesson_btn_'+lessonCode+'" onclick="deleteLesson(\'' + lessonCode + '\')" class="cssbtn smallest" style="margin-right:6px">Delete</button>';
//    html += '</div>';
//    html += '<div style="clear:both"></div>';
//
//    var utc_offset_minutes = (new Date()).getTimezoneOffset();
//    html += '<div style="margin-top:8px; float:left">'
//    html += '<div class="cssbtnlabel smallest" style="width:55px; float:left; margin-right:5px;">Data:</div>';
//    html += '<button id="clear_data_btn_'+lessonCode+'" onclick="clearLesson(\'' + lessonCode + '\', true);" class="cssbtn smallest" style="margin-right:6px">Clear</button>';
//    html += '<button id="download_data_btn_'+lessonCode+'" onclick="window.location=\'/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes+'\'; return false;" class="cssbtn smallest" style="margin-right:6px">Download</button>';
//    html += '</div>';
//    html += '<div style="clear:both"></div>';
    
//    html += '<div class="cssbtngroup" style="float:left">';
//    html += '<div class="cssbtnlabel smallest" style="float: left">Activity:&nbsp;</div>';
//    html += '<button id="view_lesson_btn_'+lessonCode+'" onclick="viewLesson(\'' + lessonCode + '\')" class="cssbtn smallest">View</button> ';
//    if (lesson.is_active) {
//        html += '<button id="stop_lesson_btn_'+lessonCode+'" onclick="stopLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Stop</button> ';
//    }
//    else {
//  	  html += '<button id="start_lesson_btn_'+lessonCode+'" onclick="startLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Start</button> ';
//    }
//    html += '<button id="delete_lesson_btn_'+lessonCode+'" onclick="deleteLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Delete</button> ';
//    html += '</div>';

//    html += '<div class="cssbtngroup" style="float:left">';
//    html += '<div class="cssbtnlabel smallest" style="float:left" >Data:&nbsp;</div>';
//    html += '<button id="clear_data_btn_'+lessonCode+'" onclick="clearLesson(\'' + lessonCode + '\', true);" class="cssbtn smallest">Clear</button> ';
//    var utc_offset_minutes = (new Date()).getTimezoneOffset();
//    html += '<button id="download_data_btn_'+lessonCode+'" onclick="window.location=\'/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes+'\'; return false;" class="cssbtn smallest">Download</button>';
//    html += '</div>';
//
//    html += '<div class="cssbtngroup" style="float:left">';
//    html += '<button id="student_login_btn_'+lessonCode+'" onclick="alert(\'Not implemented yet\');" class="cssbtn smallest">Login as Student</button> ';
//    html += '</div>';
//    html += '<div style="clear:both"></div>';
    
    html += '</div>';
    return html;
}

function createLessonForm(timestamp) {	
    var html = '<form method="post" id="create_lesson_form" onsubmit="createLesson(); return false;" class="wufoo">';
    html += '<ul>';
    html += '<li>';
    html += '<label class="lesson_title desc">Activity name</label>';
    html += '<input type="text" size="50" name="lesson_title" value="'+(timestamp?'LN:'+timestamp:'')+'" class="login_box field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="class_name desc">Class name (optional)</label>';
    html += '<input type="text" size="50" name="class_name" value="'+(timestamp?'CN:'+timestamp:'')+'" class="login_box field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="lesson_description desc">Activity description</label>';
    html += '<textarea rows="4" name="lesson_description" class="field textarea small flwid">'+(timestamp?'LD:'+timestamp:'')+'</textarea>';
    html += '</li>';
    html += '</ul>';
  
    html += '<header class="info"><h3>Tasks</h3></header>';
    
    if (!NEW_TASK_FORM_DESIGN) {
    	MAX_NUM_TASKS = 5;
        html += '<ul>';
        for (var i=1; i<=MAX_NUM_TASKS; i++) {
           html += '<li class="leftHalf">';
           html += '<label class="desc">Task #'+i+' name</label>';
           html += '<input style="width:95% !important" type="text" name="task_title_'+i+'" value="'+(timestamp?'TN:'+timestamp+'#'+i:'')+'" class="field text fn flwid"></input>';
           html += '</li>';
           html += '<li class="rightHalf">';
           html += '<label class="desc">Task #'+i+' description</label>';
           html += '<textarea style="width:100% !important" rows="2" name="task_description_'+i+'" value="'+(timestamp?'TD:'+timestamp+'#'+i:'')+'" class="field textarea flwid"></textarea>';
           html += '</li>';
           html += '<div class="clearfix"></div>';
        }
        html += '</ul>';
    	html += '<input type="hidden" name="max_num_tasks" value="'+MAX_NUM_TASKS+'">';
	}

	if (NEW_TASK_FORM_DESIGN) {
        // TODO: Make styling of + and - buttons nicer
	    html += '<ul id="tasks">';
	    html += '<li id="task">';
	    html += '<label class="task_title_label desc">Task #1 name</label>';
	    html += '<input type="text" size="50" value="" class="task_title field text fn flwid"></input>';
	    html += '<label class="task_description_label desc" style="margin-top:5px">Task #1 description</label>';
	    html += '<textarea class="task_description field textarea smaller flwid"></textarea>';
	    html += '<span class="inline"><a class="task_minus">[-]</a> <a class="task_plus">[+]</a></span>';
	    html += '</li>';
	    html += '</ul>';
		html += '<input type="hidden" name="max_num_tasks" value="'+MAX_NUM_TASKS+'">';
	}
	
	html += '<input type="hidden" name="action" value="create">';
	html += '<input type="submit" value="Create Activity" class="cssbtn"></input>&nbsp;&nbsp;'; 
	html += '<input type="button" value="Cancel" class="cssbtn" onclick="changePane(VIEW_ALL_LESSONS);"></input>'; 
	    
    html += '</form>';

    $('#content_title').html('Create activity');
    $('#content').html(html);
    updateTasks();
}

function updateTasks() {
	var i=1;
	var taskCount = $('#tasks').children().length;
	$('#tasks').children().each(function() {
		var task = $(this);
		task.attr("id", "task_"+i);
		updateTaskAttrs('task_title_label', task, i);
		updateTaskAttrs('task_title', task, i);
		updateTaskAttrs('task_description_label', task, i);
		updateTaskAttrs('task_description', task, i);
		updateTaskAttrs('task_plus', task, i);
		updateTaskAttrs('task_minus', task, i);
		$('.task_title_label', task).html('Task #'+i+' name');
		$('.task_description_label', task).html('Task #'+i+' description');
		$('.task_plus', task).toggle(i==taskCount && i<MAX_NUM_TASKS);
		$('.task_minus', task).toggle(i>1);
		i++;
	});
	
	$('.task_plus').unbind('click');
	$('.task_plus').click(function(event) {
		addTask(event.target.id);
	});

	$('.task_minus').unbind('click');
	$('.task_minus').click(function(event) {
		removeTask(event.target.id);
	});
}

function updateTaskAttrs(taskName, parent, i) {
	var taskObj = $('.'+taskName, parent);
	taskObj.attr("id", taskName+'_'+i);
	taskObj.attr("name", taskName+'_'+i);	
}

function addTask(plus) {
	var index = getTaskIndex(plus);
	var clone = $('#task_1').clone();
	$('.task_title', clone).val("");
	$('.task_description', clone).val("");
	clone.insertAfter("#task_"+index);
	updateTasks();
}

function removeTask(minus) {
	var index = getTaskIndex(minus);
	$('#task_'+index).remove();
	updateTasks();
}

function getTaskIndex(id) {
	return id.substring(id.lastIndexOf("_")+1, id.length);
}

function createLesson() {
	$.ajax( "/teacher_dashboard", {
		async: false,
		data: $('#create_lesson_form').serialize(),
		dataType: 'json',
		success: function(data) {
			if (data.error == undefined) {
				$('#error').hide();
				g_lessons = data;
				window.location.hash = VIEW_ALL_LESSONS;
				if (typeof updateUI == 'function') {
					updateUI();
				}
			}
			else {
				$('#error').html(data.msg);
				$('#error').show();
			}
		}
	});
}

function viewLesson(lessonCode) {
	window.location = "/teacher/" + lessonCode;
}

function startLesson(lessonCode) {
	$.ajax( "/teacher_dashboard", {
			async: false,
			data: {
				action: "start",
				lesson_code: lessonCode,
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					var lesson = getLesson(lessonCode);
					lesson.is_active = true;
					lesson.stop_time = null;
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
}

function stopLesson(lessonCode) {
	var lesson = getLesson(lessonCode);
	$.ajax("/teacher_dashboard", {
			async: false,
			data: {
				action: "stop",
				lesson_code: lessonCode
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					lesson.is_active = false;
					lesson.stop_time = (new Date());
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
}

function stopAllLessons() {
	$.ajax("/teacher_dashboard", {
			async: false,
			data: {
				action: "stopall"
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					var stop_time = new Date();
					for (var i=0; i<g_lessons.length; i++ ) {
					   g_lessons[i].is_active = false;
					   g_lessons[i].stop_time = stop_time;
					}
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
}

function clearLesson(lessonCode, showDialog) {
	var lesson = getLesson(lessonCode);
	$.ajax("/teacher_dashboard", {
			async: false,
			data: {
				action: "clear",
				lesson_code: lessonCode
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					g_students = {};
					if (typeof updateUI == 'function') {
					   updateUI();
					}
					if (showDialog) {
					    showMessageDialog('All student data has been cleared from activity '+ lessonCode);
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
}

function deleteLesson(lessonCode) {
	$.ajax("/teacher_dashboard", {
		async: false,
		data: {
			action: "delete",
			lesson_code: lessonCode,
		},
		success: function(data,textStatus,jqXHR) {
			if (data.trim()=="OK") {
				for( var i=0,l=g_lessons.length; i<l; i++ ) {
					if( g_lessons[i].lesson_code==lessonCode ) {
						g_lessons.splice(i,1);
						break;
					}
				}
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
}

function deleteAllLessons() {
	$('#delete_warning').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/teacher_dashboard", {
    			async: false,
    			data: {
    				action: "deleteall"
    			},
    			success: function(data,textStatus,jqXHR) {
    				if (data.trim()=="OK") {
    					g_lessons = [];
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

function editLesson(lessonCode) {
	alert('Not implemented yet');
}

function downloadLesson(lessonCode) {
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
	parent.location = '/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes;
}

function downloadAllLessons() {
	alert('Not implemented yet');
// TODO: Only one download started ... need to zip data files first and download zip
//  for (var i=0; i<g_lessons.length; i++) {
//	   downloadLesson(g_lessons[i].lesson_code);
//  }
}

function logoutStudent(studentNickname, lessonCode) {
	$.ajax("/teacher_dashboard", {
		async: false,
		data: {
			action: "logoutstudent",
			student_nickname: studentNickname,
			lesson_code: lessonCode,
		}
	});
}

function showMessageDialog(msg) {
	showMessageDialogWithOptions(msg, 300);
}

function showMessageDialogWithOptions(msg, width) {
	$('#message_text').html(msg);
    $('#message_dialog').dialog({
        autoOpen: true,
        modal: true,
        width: width,
        buttons: {
            OK: function() {
                $(this).dialog("close");
            }
        }
    });
}