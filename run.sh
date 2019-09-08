#!/bin/bash -e

docker run -d --name=bmsurge-bot --restart=always -v "$PWD/bot.js:/usr/src/app/bot.js" -v /etc/bmsurge-bot.json:/usr/src/app/discord.config.json bmsurge-bot
