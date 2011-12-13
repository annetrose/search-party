function initialize() {
	initializeLessonLists();
	var lessonCode = window.location.hash.substr(1) || null;
	if( lessonCode===null ) {
		switchToCreateLesson();
	}
	else {
		switchToLesson(lessonCode);
	}
}

function initializeLessonLists() {
	var lessons_list_parts_active = [];
	var lessons_list_parts_inactive = [];
	var lessons_list_active = document.getElementById("lessons_list_active");
	var lessons_list_inactive = document.getElementById("lessons_list_inactive");

	$.each(g_lessons, function (i,lesson) {
		link = '<div><a href="#' + lesson.lesson_code + '" onclick="switchToLesson(\'' + lesson.lesson_code + '\'); return true;">' + lesson.title + '</a></div>';
		if(lesson.is_active) {
			lessons_list_parts_active.push(link);
		}
		else {
			lessons_list_parts_inactive.push(link);
		}
	});

	if(lessons_list_parts_active.length==0) {
		lessons_list_parts_active.push("(None)");
	}
	if(lessons_list_parts_inactive.length==0) {
		lessons_list_parts_inactive.push("(None)");
	}

	lessons_list_active.innerHTML = lessons_list_parts_active.join("");
	lessons_list_inactive.innerHTML = lessons_list_parts_inactive.join("");
}

function switchToCreateLesson() {
	var lessonPane = document.getElementById("lesson_pane");
	lessonPane.innerHTML = "";
	lessonPane.style.display = "none";
	var createLessonPane = document.getElementById("create_lesson_pane");
	createLessonPane.style.display = "block";
	document.getElementById("create_lesson_link").style.visibility = "hidden";
}
function switchToLesson(lessonCode) {
	var lesson = getLesson(lessonCode);
	var parts = [];
	parts.push('<h3>' + lesson.title + '</h3>');
	parts.push('<table class="lesson">');
	parts.push('<tr>');
	parts.push('<td class="lesson_title">' + lesson.title + '</td>');
	parts.push('<td class="class_name">' + lesson.class_name + '');
	parts.push('</tr>');
	parts.push('<tr>');
	parts.push('<td colspan="2" class="lesson_description">' + lesson.description + '</td>');
	parts.push('</tr>');
	parts.push('</table>');
	parts.push('<h3 class="task_label">Tasks</h3>');

	parts.push('<table class="task">');
	$.each(lesson.tasks, function (i,task_info) {
		var task_title = task_info[0];
		var task_description = task_info[1];
		parts.push('<tr>');
		parts.push('<td class="task_number">' + (i+1) + '.</td>');
		parts.push('<td class="task_title">' + task_title + '</td>');
		parts.push('<td class="task_description">' + task_description + '</td>');
		parts.push('</tr>');
	});
	parts.push('</table>');

	parts.push('<table border="0" width="100%">');
	parts.push('<tr>');
	parts.push('<td style="text-align: left;">');
	var startButtonStyle = "display: " + (lesson.is_active ? "none" : "inline-block");
	var stopButtonStyle  = "display: " + (lesson.is_active ? "inline-block" : "none");
	parts.push('<button id="viewLessonButton" onclick="viewLesson(\'' + lessonCode + '\')">View lesson activity</button>');
	parts.push(' &nbsp; ');
	parts.push('<button id="startLessonButton" onclick="startLesson(\'' + lessonCode + '\')" style="' + startButtonStyle + '">Start lesson</button>');
	parts.push('<button id="stopLessonButton" onclick="stopLesson(\'' + lessonCode + '\')"   style="' + stopButtonStyle  + '">Stop lesson</button>');
	parts.push('</td>');
	parts.push('<td style="text-align: right;">');
	parts.push('<button id="deleteLessonButton" onclick="deleteLesson(\'' + lessonCode + '\')">Delete lesson</button>');
	parts.push('</td>');
	parts.push('</tr>');
	parts.push('</table>');

	var lessonPane = document.getElementById("lesson_pane");
	var createLessonPane = document.getElementById("create_lesson_pane");
	createLessonPane.style.display = "none";
	lessonPane.innerHTML = parts.join("");
	lessonPane.style.display = "block";
	document.getElementById("create_lesson_link").style.display = "visible";
	return false;
}

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

function viewLesson(lessonCode) {
	window.location = "/teacher/" + lessonCode;
}

function startLesson(lessonCode) {
	$.ajax( "/teacher_lessons", {
			async: false,
			data: {
				action: "start",
				lesson_code: lessonCode,
			},
			success: function(data,textStatus,jqXHR) {
				if( data.trim()=="OK" ) {
					var lesson = getLesson(lessonCode);
					lesson.is_active = true;
					lesson.stop_time = null;
					initializeLessonLists();
					$.get("/teacher_lessons?action=start&lesson_code=%s"%lessonCode)
					document.getElementById("stopLessonButton").style.display = "inline-block";
					document.getElementById("startLessonButton").style.display = "none";
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
	$.ajax("/teacher_lessons", {
			async: false,
			data: {
				action: "stop",
				lesson_code: lessonCode
			},
			success: function(data,textStatus,jqXHR) {
				if( data.trim()=="OK" ) {
					lesson.is_active = false;
					lesson.stop_time = (new Date());
					document.getElementById("stopLessonButton").style.display = "none";
					document.getElementById("startLessonButton").style.display = "inline-block";
					initializeLessonLists();
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
	$.ajax("/teacher_lessons", {
		async: false,
		data: {
			action: "start",
			lesson_code: lessonCode,
		},
		success: function(data,textStatus,jqXHR) {
			if( data.trim()=="OK" ) {
				for( var i=0,l=g_lessons.length; i<l; i++ ) {
					if( g_lessons[i].lesson_code==lessonCode ) {
						g_lessons.splice(i,1);
						break;
					}
				}
				switchToCreateLesson();
				initializeLessonLists();
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
