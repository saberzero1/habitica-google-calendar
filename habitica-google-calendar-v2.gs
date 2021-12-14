const CALENDAR_NAME = "";
const HABITICA_TOKEN = "";
const HABITICA_ID = "";
const CALENDAR_MAIL_ADDRESS = "";

function syncToHabbitica() {
  const habTaskURL = "https://habitica.com/api/v3/tasks/";

  const today = new Date();
  const daysAhead = 7;
  const events = [];
  var dates = [];
  for (i = 0; i < daysAhead; i++){
    dates.push(new Date(today.getTime() + i*1000*60*60*24));
  }
  for(i = 0; i < 7; i++){
    events[i] = CalendarApp.getCalendarsByName(CALENDAR_NAME)[0].getEventsForDay(dates[i]);
  }
  console.log(dates);
  console.log(today);
  console.log(events);

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
  const existingTasks = fetchExistingTasks(habTaskURL, templateParams);
  const completedTasksContent = fetchTodayCompletedTasks(
    habTaskURL,
    templateParams,
    today
  );

  deleteCalendarTasks(habTaskURL, existingTasks, templateParams, dates);

  for (j = 0; j < events.length; j++) {
    for (i = 0; i < events[j].length; i++) {
      if (newTasks.indexOf(events[j][i].getTitle()) === -1) {
        newTasks.push(events[j][i].getTitle());

        var taskTitle = events[j][i].getTitle();
        var taskTimeStart = events[j][i].getStartTime().toISOString();
        console.log(taskTimeStart);
        var taskTime = events[j][i].getStartTime().toString().substring(0, 25);
        var taskTimeEnd = events[j][i].getEndTime().toString().substring(0, 25);
        const params = templateParams._post;
        params["payload"] = {
          text: ":calendar: " + taskTitle,
          notes: "Start: " + taskTime + "\n\nEnd: " + taskTimeEnd,
          type: "daily",
          priority: "2",
          date: taskTimeStart,
          startDate: taskTimeStart,
          repeat: "false"
        }

        const paramsText = completedTasksContent.indexOf(params.payload.text);
        if (completedTasksContent.indexOf(params.payload.text) === -1) {
          console.log("Fetching");
          UrlFetchApp.fetch(habTaskURL + "user", params);
        }
      }
    }
  }

  var sorting = fetchExistingTasks(habTaskURL, templateParams);
  console.log(sorting.data[0]);
  var sortArray = [];
  for (i = 0; i < sorting.data.length; i++) {
    if (sorting.data[i].type == "daily") {
      sortArray.push({date: sorting.data[i].startDate, time: sorting.data[i].notes.substring(15, sorting.data[i].notes.length-1), id: sorting.data[i]._id});
    }
  }
  var unsortedArray = sortArray;
  sortArray.sort((a, b) => (a.date > b.date) ? 1 : (a.date === b.date) ? ((a.time > b.time) ? 1 : -1) : -1 )
  console.log(sortArray);
  console.log(unsortedArray);
  sortArray.reverse();
  for (i = 0; i < sortArray.length; i++) {
    UrlFetchApp.fetch(habTaskURL + sortArray[i].id + "/move/to/0", templateParams._post);
  }
}

function fetchExistingTasks(habTaskURL, templateParams) {
  const response = UrlFetchApp.fetch(
    habTaskURL + "user?type=dailys",
    templateParams._get
  );
  return JSON.parse(response.getContentText());
}

function deleteCalendarTasks(habTaskURL, habTasks, templateParams, dates) {
  for (j = 0; j < habTasks.data.length; j++) {
    if (habTasks.data[j].text.indexOf(":calendar: ") > -1 && habTasks.data[j].completed == true) {
      console.log(habTasks.data[j]);
      UrlFetchApp.fetch(
        habTaskURL + habTasks.data[j].id,
        templateParams._delete
      );
      deleteCalendarEvents(habTasks.data[j].text, dates);
    }
  }
}

function fetchTodayCompletedTasks(habTaskURL, templateParams, today) {
  const tasksContent = [];
  const response = UrlFetchApp.fetch(
    habTaskURL + "user?type=dailys",
    templateParams._get
  );
  const tasks = JSON.parse(response.getContentText());

  for (i = 0; i < tasks.data.length; i++) {
    if (tasks.data[i].text.indexOf(":calendar: ") > -1) {
      const taskDate = new Date(tasks.data[i].createdAt).getDate();
      if (taskDate + 12 !== today.getDate()) {
        console.log(tasks.data[i]);
        tasksContent.push(tasks.data[i].text);
      }
    }
  }
  return tasksContent;
}

// deletes calendar events from Google Calendar based on title
function deleteCalendarEvents(eventTitle, dates) {
  title = eventTitle.replace(':calendar: ', '');
  var fromDate = new Date(dates[0]); 
  var toDate = new Date(dates[dates.length-1]);
  var calendar = CalendarApp.getCalendarsByName(CALENDAR_NAME)[0];
  var eventsCalendar = calendar.getEvents(fromDate, toDate);
  for(i = 0; i < eventsCalendar.length;i++){
    var ev = eventsCalendar[i];
    if(ev.getTitle()==title && ev.getCreators()==CALENDAR_MAIL_ADDRESS){
    // show event name in log
    Logger.log(ev.getTitle()); 
    ev.deleteEvent();
    }
  }
}
