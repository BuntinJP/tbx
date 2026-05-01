#!/usr/bin/env osascript

on run argv
	set intervalSeconds to 240

	if (count of argv) > 0 then
		set intervalSeconds to (item 1 of argv as integer)
	end if

	tell application "System Events"
		repeat
			key code 57
			log "prevent-sleep: sent Space key"
			delay intervalSeconds
		end repeat
	end tell
end run
