// This code is licensed under the same terms as Habitica:
// https://raw.githubusercontent.com/HabitRPG/habitrpg/develop/LICENSE
// For questions or suggestions, message @saberzero1 on Habitica or open an issue on GitHub.
// User ID and API Token can be founnd here: https://habitica.com/user/settings/api
// For more information on the Habitica API: https://habitica.com/apidoc/
var habId = "";
var habToken = "";
var calendarMame = "HabiticaReminders";

// Custom settings
var priority = "2.0"; // Priority of created task. Possible values: "0.1", "1", "1.5", "2"
var attribute = "con"; // Attribute to use for task. Possible values: "str", "int", "con", "per"

// Schedules calendar items for current day into Habitica.
// Uses calendar titles as todo items and descriptions as subtasks.
function scheduleToDos() {
  var now = new Date();
  // Replace "HabiticaReminders" with desired calendar name.
  var events = CalendarApp.getCalendarsByName(calendarMame)[0].getEventsForDay(now);
  
  // Get current date
  var today = new Date();
  var endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  today.setHours(2,3,5,9);
  endOfWeek.setHours(2,3,5,9);
  
  var eventsToParse = [];
  var eventsToParseBase = [];
  
  var descString = "";
  var descArray = [];
  var arrayOfDescArray = [];
  var arrayOfDescArrayBase = [];
  
  var retrievedTasks = [];
  var retrievedID = ""
  
  var urlString = "https://habitica.com/api/v3/tasks/user?type=todos";
  var urlTaskStart = "https://habitica.com/api/v3/tasks/"
  var urlTaskEnd = "/checklist"
  
  var paramsTemplatePost = {
    "method" : "post",
    "headers" : {
      "x-api-user" : habId, 
      "x-api-key" : habToken
    }
  }
  var paramsTemplateGet = {
    "method" : "get",
    "headers" : {
      "x-api-user" : habId, 
      "x-api-key" : habToken
    }
  }
  
  // Push calendar events to the array
  for (l = 0; l < events.length; l++) {
    eventsToParseBase.push(events[l]);
  }
  eventsToParse = eventsToParseBase.reverse();
  if (eventsToParse.length > 0) {
    // Adds all events of today from calendar to Habitica.
    for (i = 0; i < eventsToParse.length; i++) {
      var paramsPost = paramsTemplatePost;
      // Check for weekly goals.
      if(eventsToParse[i].getTitle() == "Weekly Goals") {
        paramsPost["payload"] = {
          "text" : eventsToParse[i].getTitle(), 
          "type" : "todo",
          "priority" : priority,
          "attribute" : attribute, 
          "date" : endOfWeek.toString()
        }
      }
      // Daily goals.
      else 
      {
        paramsPost["payload"] = {
          "text" : eventsToParse[i].getTitle(), 
          "type" : "todo",
          "priority" : priority,
          "attribute" : attribute,
          "date" : today.toString()
        }
      }
      // Process description lines into subtasks.
      descString = eventsToParse[i].getDescription().toString();       
      var descStringTemp = descString.replace(/<br\s*[\/]?>/g, "\n");
      var descStringRegex = descStringTemp.replace(/<\/?[^>]+(>|$)/g, "");
      descArray = descStringRegex.toString().split("\n");
      arrayOfDescArrayBase.unshift(descArray);
      UrlFetchApp.fetch("https://habitica.com/api/v3/tasks/user", paramsPost);
      Utilities.sleep(5000);
    }
    Utilities.sleep(5000);
    arrayOfDescArray = arrayOfDescArrayBase.reverse();
    var paramsGet = paramsTemplateGet
    retrievedTasks = UrlFetchApp.fetch(urlString, paramsGet);
    // Adds the description lines as subtasks to the corresponding todo.
    for (n = 0; n < eventsToParse.length; n++) {
      retrievedID = retrievedTasks.toString().split("\"_id\":\"")[(eventsToParse.length-n)].substring(0, 36);
      var urlTask = urlTaskStart + retrievedID + urlTaskEnd;
      for (k = 0; k < arrayOfDescArray[n].length; k++) {
        if(arrayOfDescArray[n][k].length > 0) {  
          var paramsChecklist = paramsTemplatePost;
          paramsChecklist["payload"] = {
            "text" : arrayOfDescArray[n][k]
          }
          UrlFetchApp.fetch(urlTask, paramsChecklist);
          Utilities.sleep(5000);
        }
      }
    }
  }
}