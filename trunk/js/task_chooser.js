function _taskChanged(eventObject) {
	//var select = eventObject.target;
	//var option = select.options[select.selectedIndex];
	var select = $("#task_chooser").get(0);
	var taskIdx = selectedTaskIdx();
	var option = select.options[taskIdx];
	var optionId = option.id;
	var descriptionId = optionId.replace("task_title_", "task_description_");
	$(".task_description.selected").removeClass("selected");
	$("#"+descriptionId).addClass("selected");
	if(typeof onTaskChanged != "undefined") {
		onTaskChanged(taskIdx);
	}
}

$(function() {
	$("#task_chooser").change(_taskChanged);
});

function selectedTaskIdx() {
	return $("#task_chooser").get(0).selectedIndex;
}

function numberOfTasks() {
	return $("#task_chooser").get(0).childNodes.length;
}
