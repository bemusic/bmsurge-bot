const Discord = require('discord.js')
const fs = require('fs')
const config = require('./discord.config.json')
const icy = require('icy')

process.on('unhandledRejection', up => {
  throw up
})

const client = new Discord.Client()

client.login(config.token)

client.on('ready', () => {
  const guild = client.guilds.get(config.guildId)
  if (!guild) {
    throw new Error('Cannot find guild.')
  }
  const voiceChannel = guild.channels.find(ch => {
    return ch.name === config.channelName && ch.type === 'voice'
  })
  if (!voiceChannel) {
    throw new Error('Cannot find voice channel.')
  }
  console.log('Joining...')
  join(client, voiceChannel)
})

/**
 * @param {Discord.Client} client
 * @param {Discord.VoiceChannel} voiceChannel
 */
async function join(client, voiceChannel) {
  const voiceConnection = await voiceChannel.join()
  icy.get('http://cloud.spacet.me:8000/be-music-surf', stream => {
    stream.on('metadata', async function(metadata) {
      var parsed = icy.parse(metadata)
      console.error(parsed)
      try {
        const presence = await client.user.setActivity(parsed.StreamTitle, {
          type: 'PLAYING',
          url: 'http://be-music.surge.sh/'
        })
      } catch (e) {
        console.error('Failed to set activity', e)
      }
    })
    setTimeout(() => {
      voiceConnection.playStream(stream)
    }, 500)
  })
}
