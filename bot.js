const Discord = require('discord.js')
const fs = require('fs')
const config = require('./discord.config.json')
const icy = require('icy')
const axios = require('axios')

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

client.on('message', msg => {
  try {
    if (msg.channel.type !== 'dm') {
      return
    }
    if (msg.author.id === client.user.id) {
      return
    }
    console.log('DM', msg.author.id, msg.content)
    const reply = text => {
      console.log('DM reply', text)
      msg.reply(text)
    }
    axios.post(config.dmURL, { userId: msg.author.id, username: msg.author.username, content: msg.content })
      .then(response => {
        return reply(String(response.data))
      })
      .catch(error => {
        return reply(`Sorry, I ran into a problem... ${error}`)
      })
  } catch(e) {
    console.error(e)
  }
})

/**
 * @param {Discord.Client} client
 * @param {Discord.VoiceChannel} voiceChannel
 */
async function join(client, voiceChannel) {
  const voiceConnection = await voiceChannel.join()
  icy.get('http://cloud.spacet.me:8000/be-music-surge', stream => {
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

async function sendAnalytics() {
  try {
    const response = await axios.get('http://cloud.spacet.me:8000/', { responseType: 'text' })
    const text = response.data
    const listeners = Math.max(0, require('cheerio').load(text)('table tr:nth-of-type(6) .streamdata').text() - 1)
    console.log('Listeners:', listeners)
    await axios.get(`https://api.amplitude.com/httpapi`, {
      params: {
        api_key: config.amplitudeApiKey,
        event: JSON.stringify({
          user_id: 'bmsurge-bot',
          event_type: 'Listeners',
          event_properties: {
            listeners: listeners
          }
        })
      }
    })
  } catch (e) {
    console.error('Failed to send analytics', e)
  }
}

setInterval(sendAnalytics, 300000)
sendAnalytics()
