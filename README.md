
[![Habitica API](https://img.shields.io/badge/Habitica%20API-v3-purple.svg)](https://habitica.com/apidoc/)
[![Google App Scripts](https://img.shields.io/badge/Google%20App%20Scripts-v2019-green.svg)](https://script.google.com/home)
[![License](https://img.shields.io/github/license/saberzero1/habitica-google-calendar)](https://github.com/saberzero1/habitica-google-calendar/blob/main/LICENSE)


# Habitica Google Calendar Synchronization

Automatically sync Google Calendar entries as Habitica To Do items.

## Features

- Automatically sync Google Calendar items to Habitica dailies.
- Automatically check off Google Calendar items when checked off in Habitica.
- Turn description lines into checklist items.

## Installation

 - Copy the contents of `habitica-google-calendar-v2.gs` into an empty Google App Scripts file.
 - Create a Google Calendar for the Dailies, or use an existing one.
 - Set the values of `CALENDAR_NAME` and `CALENDAR_MAIL_ADDRESS` to match your Google Calendar account.
 - Set the values of `HABITICA_TOKEN` and `HABITICA_ID` to match your Habitica account. (<a href="https://habitica.com/user/settings/api">Click here</a> to find your tokens)
 - Set the number of days, including today, to sync ahead.
 - Set a daily time-based trigger to execute `syncToHabbitica()`. I recommend every 5 minutes.
 - Insert some calendar entries in the Google Calendar.
 - The program will automatically sync to Habitica.
 
    
## Verifying installation

To verify the installation, create a calendar entry with a description for today in the Google Calendar in the calendar selected earlier.

Manually execute the `syncToHabbitica()` function and wait for it to finish.

The entry should appear in Habitica as a daily item.

**Note:** The default timezone for Google Scripts is America/Los_Angeles (Pacific time). If your calendar is in a different timezone, this will not be taken into account. The easiest way to address this is to add an [app manifest](https://developers.google.com/apps-script/concepts/manifests) and change the timezone to one of the [valid values](https://docs.oracle.com/javase/8/docs/api/java/time/ZoneId.html) that correspond to the timezone of your calendar.
