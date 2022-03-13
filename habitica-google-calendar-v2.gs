const CALENDAR_NAME = "";                                      // Name of the Google Calendar to sync.
const CALENDAR_MAIL_ADDRESS = "";                              // Mail account linked to the Google Calendar.
const HABITICA_TOKEN = "";                                     // Habitica Token.
const HABITICA_ID = "";                                        // Habitica ID.
                                                               // To find your Habitica Token and Habitica ID visit:
                                                               // https://habitica.com/user/settings/api
                                                               // Click "Show API Token" to reveal your token.

function syncToHabbitica() {
  const habTaskURL = "https://habitica.com/api/v3/tasks/";

  const today = new Date();
  const daysAhead = 1; // Number of days to sync including today.
  const events = [];
  var dates = [];
  // Computes the date range.
  for (i = 0; i < daysAhead; i++){
    dates.push(new Date(today.getTime() + i*1000*60*60*24));
  }
  // Fetches the Google Calendar entries for the given date range.
  for(i = 0; i < daysAhead; i++){
    events[i] = CalendarApp.getCalendarsByName(CALENDAR_NAME)[0].getEventsForDay(dates[i]);
  }

  // Request templates.
  const templateParams = {
    _post: {
      method: "post",
      headers: { "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
    },
    _get: {
      contentType: "application/json",
      method: "get",
      headers: { "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
    },
    _delete: {
      method: "delete",
      headers: { "x-api-user": HABITICA_ID, "x-api-key": HABITICA_TOKEN },
    },
  };

  const newTasks = [];
  // Fetches tasks on Habitica.
  const existingTasks = fetchExistingTasks(
    habTaskURL,
    templateParams
  );
  // Fetches tasks already marked as completed on Habitica.
  const completedTasksContent = fetchCompletedTasksOnDate(
    habTaskURL,
    templateParams,
    today
  );

  // Fetches tasks already present on Habitica.
  var present = [];
  for (i = 0; i < existingTasks["data"].length; i++) {
    present.push(existingTasks["data"][i].alias);
  }

  // Deletes Habitica tasks checked as done then deletes correspondingg Google Calendar items.
  deleteCalendarTasks(habTaskURL, existingTasks, templateParams, dates);

  for (j = 0; j < events.length; j++) {
    for (i = 0; i < events[j].length; i++) {
      if (newTasks.indexOf(events[j][i].getTitle() + events[j][i].getStartTime().toISOString()) === -1) {
        newTasks.push(events[j][i].getTitle() + events[j][i].getStartTime().toISOString());

        // Google Calender item properties.
        var taskTitle = events[j][i].getTitle();
        var taskTimeStart = events[j][i].getStartTime().toISOString();
        var taskTime = events[j][i].getStartTime().toString().substring(0, 25);
        var taskTimeEnd = events[j][i].getEndTime().toString().substring(0, 25);
        var ali = getDateFromISO(taskTimeStart).toString().toUpperCase() + getDateFromISO(taskTimeEnd).toString().toUpperCase() + events[j][i].getTitle().toString().toUpperCase().replace(/[^0-9a-z]/gi, '')
        var description = removeTags(events[j][i].getDescription());

        var descriptionArray = [];
        // Split the lines of a description in separate subtasks if a description is present in Google Calendar item.
        if (description.length > 0) {
          descriptionArray = description.split("$br$");
        }
        else {
          descriptionArray = [];
        }
        const params = templateParams._post;
        params["payload"] = {
          text: ":calendar: " + taskTitle,
          notes: "Start: " + taskTime + "\n\nEnd: " + taskTimeEnd,
          alias: ali,
          type: "daily",
          priority: "2",
          date: taskTimeStart,
          startDate: taskTimeStart,
          repeat: "false"
        }

        // Check if task is marked as completed.
        var paramsText = completedTasksContent.indexOf(params.payload.text);
        // Tasks is new and will be added.
        if (paramsText == -1 || params.payload.alias != present[present.indexOf(params.payload.alias)]) {
          UrlFetchApp.fetch(habTaskURL + "user", params);
          Utilities.sleep(5000);
          // Add description lines as subtasks.
          if (descriptionArray.length != 0) {
            var retrievedTasks = JSON.parse(UrlFetchApp.fetch(habTaskURL + "user?type=dailys", templateParams._get));
            Utilities.sleep(100);
            var retrievedID = retrievedTasks["data"][0]._id;
            var urlTask = "https://habitica.com/api/v3/tasks/" + retrievedID + "/checklist";
            for (k = 0; k < descriptionArray.length; k++) {
              var paramsChecklist = templateParams._post;
              paramsChecklist["payload"] = {
                "text" : descriptionArray[k]
              }
              UrlFetchApp.fetch(urlTask, paramsChecklist);
              Utilities.sleep(5000);
            }
          }
        }
      }
    }
  }

  // Sorts the tasks chronologically.
  var sorting = fetchExistingTasks(habTaskURL, templateParams);
  var sortArray = [];
  var unsortedArray = [];

  // Checks order of tasks.
  for (i = 0; i < sorting.data.length; i++) {
    if (sorting.data[i].type == "daily") {
      if (sorting.data[i].notes != null) {
        if (sorting.data[i].notes.startsWith("Start:")) {
          sortArray.push({date: sorting.data[i].startDate, time: sorting.data[i].notes.substring(15, sorting.data[i].notes.length-1), id: sorting.data[i]._id, text: sorting.data[i].text});
          unsortedArray.push({date: sorting.data[i].startDate, time: sorting.data[i].notes.substring(15, sorting.data[i].notes.length-1), id: sorting.data[i]._id, text: sorting.data[i].text});
        }
        // Tasks created by the user, keeps these on top.
        else {
          sortArray.push({date: sorting.data[i].startDate, time: "01 1970 00:00:00", id: sorting.data[i]._id, text: sorting.data[i].text});
          unsortedArray.push({date: sorting.data[i].startDate, time: "01 1970 00:00:00", id: sorting.data[i]._id, text: sorting.data[i].text});
        }
      }
      // Tasks created by the user, keeps these on top.
      else {
        sortArray.push({date: sorting.data[i].startDate, time: "01 1970 00:00:00", id: sorting.data[i]._id, text: sorting.data[i].text});
        unsortedArray.push({date: sorting.data[i].startDate, time: "01 1970 00:00:00", id: sorting.data[i]._id, text: sorting.data[i].text});
      }
    }
  }

  // Sorting priorities.
  sortArray.sort((a, b) => (a.date > b.date) ? 1 : (a.date === b.date) ? ((a.time > b.time) ? 1 : (a.time === b.time) ? ((a.text > b.text) ? 1 : -1 ) : -1 ) : -1 )
  var needsSorting = false;

  // Check if sorting is needed.
  for (var g = 0; g < sortArray.length; g++) {
    if(sortArray[g].date != unsortedArray[g].date || sortArray[g].time != unsortedArray[g].time) {
      needsSorting = true;
      break;
    }
  }

  // Sorts tasks chronologically if not already sorted that way.
  if (needsSorting) {
    sortArray.reverse();
    for (i = 0; i < sortArray.length; i++) {
      UrlFetchApp.fetch(habTaskURL + sortArray[i].id + "/move/to/0", templateParams._post);
      Utilities.sleep(5000);
    }
  }
}

// Fetches current dailies from Habitica.
function fetchExistingTasks(habTaskURL, templateParams) {
  const response = UrlFetchApp.fetch(
    habTaskURL + "user?type=dailys",
    templateParams._get
  );
  return JSON.parse(response.getContentText());
}

// Delete specified Habitica items.
function deleteCalendarTasks(habTaskURL, habTasks, templateParams, dates) {

  // Loop through all tasks.
  for (j = 0; j < habTasks.data.length; j++) {

    // If tasks was created by this script, delete it if it is marked as completed.
    if (habTasks.data[j].text.indexOf(":calendar: ") > -1 && habTasks.data[j].completed == true) {
      UrlFetchApp.fetch(
        habTaskURL + habTasks.data[j].id,
        templateParams._delete
      );

      // Delete corresponding Google Calender item.
      deleteCalendarEvents(habTasks.data[j].text, dates, habTasks.data[j].startDate);
    }
  }
}

// Fetches tasks completed on specified date.
function fetchCompletedTasksOnDate(habTaskURL, templateParams, dateValue) {
  const tasksContent = [];
  const response = UrlFetchApp.fetch(
    habTaskURL + "user?type=dailys",
    templateParams._get
  );
  const tasks = JSON.parse(response.getContentText());

  for (i = 0; i < tasks.data.length; i++) {
    if (tasks.data[i].text.indexOf(":calendar: ") > -1) {
      const taskDate = new Date(tasks.data[i].startDate).getDate();
      if (taskDate + 12 !== dateValue.getDate()) {
        tasksContent.push(tasks.data[i].text);
      }
    }
  }
  return tasksContent;
}

// Deletes calendar events from Google Calendar.
function deleteCalendarEvents(eventTitle, dates, dateTimeVal) {
  var dateTimeValueTemp = getDateFromISO(dateTimeVal) + 1000*60*60*12;
  var dateTimeValue = new Date(dateTimeValueTemp).toISOString();
  var title = eventTitle.replace(':calendar: ', '');
  var fromDate = new Date(new Date(0)); 
  var toDate = new Date(dates[dates.length-1]);
  var calendar = CalendarApp.getCalendarsByName(CALENDAR_NAME)[0];
  var eventsCalendar = calendar.getEvents(fromDate, toDate);
  for(i = 0; i < eventsCalendar.length;i++){
    var ev = eventsCalendar[i];

    // Delete Google Calendar item only if Title, Creator and Start time match.
    if(ev.getTitle()==title && ev.getCreators()==CALENDAR_MAIL_ADDRESS && ev.getStartTime().toISOString().substring(0,10)==dateTimeValue.substring(0,10)){
      ev.deleteEvent();
    }
  }
}

// Gets the date given an ISO date.
function getDateFromISO(string) {
  try{
    var aDate = new Date();
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    return aDate.setTime(Number(time));
  } catch(e){
    return;
  }
}

// Remove HTML tags from input.
function removeTags(str) {
    if ((str===null) || (str===''))
        return false;
    else
        str = str.toString();
    str = str.replace(/<br>/g, "$br$");
    str = str.replace(/(?:\r\n|\r|\n)/g, '$br$');
    str = str.replace( /(<([^>]+)>)/ig, '');
    return str;
}
