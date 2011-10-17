function taskChanged(eventObject) {
	//var select = eventObject.target;
	//var option = select.options[select.selectedIndex];
	var select = $("#task_chooser").get(0);
	var option = select.options[selectedTaskIdx()];
	var optionId = option.id;
	var descriptionId = optionId.replace("task_title_", "task_description_");
	$(".task_description.selected").removeClass("selected");
	$("#"+descriptionId).addClass("selected");
}

$(function() {
	$("#task_chooser").change(taskChanged);
});

function selectedTaskIdx() {
	return $("#task_chooser").get(0).selectedIndex;
}
