
[![Habitica API](https://img.shields.io/badge/Habitica%20API-v3-purple.svg)](https://habitica.com/apidoc/)
[![Google App Scripts](https://img.shields.io/badge/Google%20App%20Scripts-v2019-green.svg)](https://script.google.com/home)


# Habitica Google Calendar Synchronization.

Automatically sync Google Calendar entries as Habitica To Do items.

## Features

- Automatically sync from Google Calendar to Habitica.
- Turn descriptions into checklist items.

  
## Installation

 - Copy the contents of `habitica-google-calendar.gs` into an empty Google App Scripts file.
 - Create a Google Calendar for the To-Dos, or use an existing one.
 - Set the values of `habId`, `habToken` and `calendarName`.
 - Set a daily time-based trigger to execute `scheduleToDos()` somewhere after midnight in your timezone.
 - Insert some calendar entries in the Google Calendar.
 - The program will automatically sync to Habitica every day.
 
    
## Verifying installation

To verify the installation, create a calendar entry with a description for today in the Google Calendar set as `calendarName`.

Manually execute the `scheduleToDos()` function and wait for it to finish.

The entry should appear in Habitica as a To-Do item.

**Note:** The default timezone for Google Scripts is America/Los_Angeles (Pacific time). If your calendar is in a different timezone, this will not be taken into account. The easiest way to address this is to add an [app manifest](https://developers.google.com/apps-script/concepts/manifests) and change the timezone to one of the [valid values](https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html) that correspond to the timezone of your calendar.
