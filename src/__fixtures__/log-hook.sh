#!/bin/sh
# Reads JSON from stdin, appends event name to the log file specified in $HOOK_LOG
input=$(cat)
event=$(echo "$input" | sed -n 's/.*"event":"\([^"]*\)".*/\1/p')
echo "$event" >> "$HOOK_LOG"
echo '{}'
