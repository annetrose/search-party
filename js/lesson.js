var NEW_TASK_FORM_DESIGN = false;
var MAX_NUM_TASKS = 10;

var TEACHER_LESSONS = 0;
var ALL_LESSONS = 1;

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

function createLessonLists(teacherFilter, showTeacher) {
    if (teacherFilter==="") teacherFilter = undefined;
    var activeHtml = '';
    var inactiveHtml = '';
    for (var i=0; i<g_lessons.length; i++) {
       var lesson = g_lessons[i];
       if (teacherFilter==undefined || teacherFilter==lesson.teacher_name) {
    		var html = getLessonHtml(lesson, showTeacher);
       		if (lesson.is_active) {
       			activeHtml += html;
       		}
       		else {           
       			inactiveHtml += html;
       		}
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

function getLessonHtml(lesson, showTeacher) {
	var lessonCode = lesson.lesson_code;
	var customStyles = '';
	var viewButton = '<button class="cssbtn smallest" style="padding:4px !important; margin-right:8px; margin-top:-2px" onclick="event.stopPropagation(); goToLesson(\''+lessonCode+'\')" title="View activity"><span class="view_icon_only"></span></button>';
//	var startTime = '';
//	if (lesson.start_time) {
//		var localStartTime = getLocalTime(eval(lesson.start_time));
//		startTime = getFormattedNumericDate(getLocalTime(eval(lesson.start_time)));
//	}
	
//	var html = '<h3 id="'+lessonCode+'"><div class="right" style="margin-top:5px;margin-right:5px;">'+viewButton+' <div style="float:right; line-height:1em">#'+lessonCode+'<span style="font-size:10px; font-style:italic; font-weight:normal; line-height:10px"><br/>'+startTime+'</span></div></div><a href="#" style="margin:0px;">'+lesson.title+'</a></h3>'
	var html = '<h3 id="'+lessonCode+'"><div class="right" style="margin-top:5px;margin-right:5px;">'+viewButton+' #'+lessonCode+'</div><a href="#" style="margin:0px;">'+lesson.title+'</a></h3>'

	html += '<div>';
    if (lesson.class_name) {
        html += '<h5>'+lesson.class_name + '</h5>';
    }
    else {
    	customStyles = 'style="padding-top:0; margin-top:0;"';
    }
    
    if (lesson.description) {
       html += '<p class="lesson_description" '+customStyles+'>'+lesson.description + '</p>';
    }
    
    if (showTeacher!=undefined && showTeacher && lesson.teacher_name) {
        html += '<h5>Teacher</h5>';
        html += '<p><ul><li>'+lesson.teacher_name+'</li></ul></p>';
    }
    
    html += '<h5 class="task_label">Tasks</h5>';
    html += '<ol>';
    $.each(lesson.tasks, function(i, task) {
        var taskTitle = task[0];
        var taskDescription = task[1];
        html += '<li>'+(i+1)+'. '+taskTitle+'</li>';
    });
    html += '</ol>';

    var utc_offset_minutes = (new Date()).getTimezoneOffset();
    html += '<ul>';
    html += '<li class="left">';
    html += '<button id="view_lesson_btn_'+lessonCode+'" onclick="goToLesson(\'' + lessonCode + '\')" class="cssbtn smallest">View Activity<span class="view"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="edit_lesson_btn'+lessonCode+'" onclick="showLessonForm(\'' + lessonCode + '\')" class="cssbtn smallest">Edit Activity<span class="edit"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    if (lesson.is_active) {
        html += '<button id="stop_lesson_btn_'+lessonCode+'" onclick="stopLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Stop Activity<span class="stop"></span></button>';
    }
    else {
        html += '<button id="start_lesson_btn_'+lessonCode+'" onclick="startLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Start Activity<span class="start"></span></button>';
    }
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="clone_lesson_btn_'+lessonCode+'" onclick="cloneLesson(\'' + lessonCode + '\', true)" class="cssbtn smallest">Clone Activity<span></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="delete_lesson_btn_'+lessonCode+'" onclick="deleteLesson(\'' + lessonCode + '\')" class="cssbtn smallest">Delete Activity<span class="del"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="download_data_btn_'+lessonCode+'" onclick="window.location=\'/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes+'\'; return false;" class="cssbtn smallest">Download Data<span class="dl"></span></button>';
    html += '</li>';
    html += '<li class="left">';
    html += '<button id="clear_data_btn_'+lessonCode+'" onclick="clearLesson(\'' + lessonCode + '\', true);" class="cssbtn smallest">Clear Data<span class="clr"></span></button>';
    html += '</li>';
    html += '</ul>';
    html += '<div style="clear: both"></div>';
    
    html += '</div>';
    return html;
}

function showLessonForm(lessonCode) {
	// NOTE: Existing data not modified when activity is edited.  Should option to clear data be given?

	var action;
	var pageTitle, activityName, className, activityDesc;
	var taskTitles = [];
	var taskDescs = [];

	var isNewLesson = lessonCode == undefined || lessonCode == '';

	if (isNewLesson) {
	    action = "createEditLesson(); return false;";
		pageTitle = 'Create activity';
		timestamp = g_dbg_timestamp;
		activityName = (timestamp?'LN:'+timestamp:'');
		className = (timestamp?'CN:'+timestamp:'');
		activityDesc = (timestamp?'LD:'+timestamp:'');
		
	    if (!NEW_TASK_FORM_DESIGN) {
	    	MAX_NUM_TASKS = 5;
	        for (var i=0; i<MAX_NUM_TASKS; i++) {
	            taskTitles[i] = (timestamp?'TN:'+timestamp+'#'+(i+1):'');
	            taskDescs[i] = (timestamp?'TD:'+timestamp+'#'+(i+1):'');
	        }
		}	    
	}
	else {
		action = "createEditLesson('"+lessonCode+"'); return false;";
		pageTitle = 'Edit activity';
		var lesson = getLesson(lessonCode);
		activityName = lesson.title;
		className = lesson.class_name;
		activityDesc = lesson.description;
		
		for (var i=0; i<lesson.tasks.length; i++) {
            taskTitles[i] = lesson.tasks[i][0];
            taskDescs[i] = lesson.tasks[i][1];
        }
		for (var i=lesson.tasks.length; i<MAX_NUM_TASKS; i++) {
			taskTitles[i] = "";
            taskDescs[i] = "";
		}
	}
	
    var html = '<form method="post" id="lesson_form" onsubmit="'+action+'" class="wufoo">';
    html += '<ul>';
    html += '<li>';
    html += '<label class="lesson_title desc">Activity name</label>';
    html += '<input type="text" size="50" name="lesson_title" value="'+activityName+'" class="login_box field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="class_name desc">Class name (optional)</label>';
    html += '<input type="text" size="50" name="class_name" value="'+className+'" class="login_box field text fn flwid"></input>';
    html += '</li>';
    html += '<li>';
    html += '<label class="lesson_description desc">Activity description</label>';
    html += '<textarea rows="4" name="lesson_description" class="field textarea small flwid">'+activityDesc+'</textarea>';
    html += '</li>';
    html += '</ul>';
  
    html += '<header class="info"><h3>Tasks</h3></header>';
    
    if (!NEW_TASK_FORM_DESIGN) {
    	MAX_NUM_TASKS = 5;
        html += '<ul>';
        for (var i=1; i<=MAX_NUM_TASKS; i++) {
           html += '<li class="leftHalf">';
           html += '<label class="desc">Task #'+i+' name</label>';
           html += '<input style="width:95% !important" type="text" name="task_title_'+i+'" value="'+taskTitles[i-1]+'" class="field text fn flwid"></input>';
           html += '</li>';
           html += '<li class="rightHalf">';
           html += '<label class="desc">Task #'+i+' description</label>';
           html += '<textarea style="width:100% !important" rows="2" name="task_description_'+i+'" class="field textarea flwid">'+taskDescs[i-1]+'</textarea>';
           html += '</li>';
           html += '<div class="clearfix"></div>';
        }
        html += '</ul>';
    	html += '<input type="hidden" name="max_num_tasks" value="'+MAX_NUM_TASKS+'">';
	}

//	if (NEW_TASK_FORM_DESIGN) {
//       // TODO: Make styling of + and - buttons nicer
//	    html += '<ul id="tasks">';
//	    html += '<li id="task">';
//	    html += '<label class="task_title_label desc">Task #1 name</label>';
//	    html += '<input type="text" size="50" value="" class="task_title field text fn flwid"></input>';
//	    html += '<label class="task_description_label desc" style="margin-top:5px">Task #1 description</label>';
//	    html += '<textarea class="task_description field textarea smaller flwid"></textarea>';
//	    html += '<span class="inline"><a class="task_minus">[-]</a> <a class="task_plus">[+]</a></span>';
//	    html += '</li>';
//	    html += '</ul>';
//		html += '<input type="hidden" name="max_num_tasks" value="'+MAX_NUM_TASKS+'">';
//	}
	
	if (isNewLesson) {
		html += '<input type="hidden" name="action" value="create">';
		html += '<input type="hidden" name="lesson_code" value="">';
		html += '<input type="submit" value="Create Activity" class="cssbtn"></input>&nbsp;&nbsp;'; 
		html += '<input type="button" value="Cancel" class="cssbtn" onclick="returnToParentPage();"></input>'; 
	}
	else {
		html += '<input type="hidden" name="action" value="edit">';
		html += '<input type="hidden" name="lesson_code" value="'+lessonCode+'">';
		html += '<input type="submit" value="Edit Activity" class="cssbtn"></input>&nbsp;&nbsp;'; 
		html += '<input type="button" value="Cancel" class="cssbtn" onclick="returnToParentPage();"></input>'; 
	}
	    
    html += '</form>';

    $('#content_title').html(pageTitle);
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

function goToLessonList() {
	var currentLocation = ''+window.location;
	if (currentLocation.indexOf('/teacher_dashboard') == -1) {
		window.location = '/teacher_dashboard';
	}
	else {
		window.location.hash = '';
		createLessonLists();
	}
}

function goToLessonForm(lessonCode) {
	var currentLocation = ''+window.location;
	if (currentLocation.indexOf('/teacher/') != -1) {
		window.location = '/teacher_dashboard#' + lessonCode + ':1';
	}
	else {
		window.location.hash = lessonCode;
		showLessonForm(lessonCode);
	}
}

function goToLesson(lessonCode) {
	window.location = "/teacher/" + lessonCode;
}

function createEditLesson(lessonCode) {
	$.ajax( "/teacher_dashboard", {
		async: false,
		data: $('#lesson_form').serialize(),
		dataType: 'json',
		success: function(data) {
			if (data.error == undefined) {
				$('#error').hide();
				g_lessons = data;
				returnToParentPage();
			}
			else {
				$('#error').html(data.msg);
				$('#error').show();
			}
		}
	});
}

function returnToParentPage() {		
	var hash = window.location.hash;
	if (hash != '') hash = hash.substring(1);
	var hashTokens = hash.split(':');
	if (hashTokens.length>1 && hashTokens[1]=='1') {
		var lessonCode = hashTokens[0];
		goToLesson(lessonCode);
	}
	else {
		goToLessonList();
	}
}

function cloneLesson(lessonCode, updateLessons) {
	var lesson = getLesson(lessonCode);
	$.ajax( "/teacher_dashboard", {
		async: false,
		data: {
			action: "clone",
			lesson_code: lessonCode,
		},
		dataType: 'json',
		success: function(data) {
			var clonedLesson = data[0];
			if (updateLessons) {
				g_lessons.push(clonedLesson);
				if (typeof updateUI == 'function') {
					updateUI();
				}
			}
			var msg = lesson.title + ' has been cloned.<br/>';
			msg += '<a href="/teacher/'+clonedLesson.lesson_code+'#students">View clone activity</a>';
			showMessageDialog(msg);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			alert('Error: Clone was not successful.');
		} 
	});
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
				lesson_code: lessonCode,
				logout: true
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					lesson.is_active = false;
					lesson.stop_time = (new Date());
					if (typeof updateUI == 'function') {
					   updateUI();
					}
					
					logoutAllStudents("Do you wish to logout all students from this activity?", lessonCode);
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
				action: "stopall",
				logout: true
			},
			success: function(data,textStatus,jqXHR) {
				if (data.trim()=="OK") {
					var stop_time = new Date();
					for (var i=0; i<g_lessons.length; i++ ) {
					   g_lessons[i].is_active = false;
					   g_lessons[i].stop_time = stop_time;
					}
					window.location.hash = '';
					if (typeof updateUI == 'function') {
					   updateUI();
					}
					
					logoutAllStudents("Do you wish to logout all students from all your activities?", undefined, TEACHER_LESSONS);	
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
					if (typeof updateData == 'function') {
						updateData();
					}
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
	$('#message').html("<p>Are you sure you want to delete all your activities?</p>");
	$('#message').dialog({
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
    					window.location.hash = '';
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

function downloadLesson(lessonCode) {
    var utc_offset_minutes = (new Date()).getTimezoneOffset();
	parent.location = '/data_dump?lesson_code='+lessonCode+'&utc_offset_minutes='+utc_offset_minutes;
}

function downloadAllLessons() {
	alert('Not implemented yet');
}

function logoutStudent(studentNickname, lessonCode) {
	$.ajax("/teacher_dashboard", {
		async: false,
		data: {
			action: "logoutstudent",
			student_nickname: studentNickname,
			lesson_code: lessonCode
		}
	});
}

function logoutAllStudents(warning, lessonCode, whichLessons) {	
	if (warning == undefined) {
		warning = "Are you sure you want to logout all students?"
	}
	$('#message').html("<p>"+warning+"</p>");
	
	var data = { action: "logoutallstudents" };
	if (lessonCode != undefined) {
		data.lesson_code = lessonCode;
	}
	if (whichLessons != undefined) {
		data.which_lessons = whichLessons;
	}
	
	$('#message').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/teacher_dashboard", {
    			async: false,
    			data: data,
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

function showMessageDialog(msg) {
	showMessageDialogWithOptions(msg, 300);
}

function showMessageDialogWithOptions(msg, width) {
	$('#message').html('<p>'+msg+'</p>');
    $('#message').dialog({
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
