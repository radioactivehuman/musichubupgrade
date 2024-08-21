const express = require('express');
const YouTube = require("youtube-sr").default;
const app = express();
const path = require('path');
const port = 3000;
const fs = require('fs');
const ytdl2 = require("@distube/ytdl-core");
// const ytdl2 = require('./lib/ytdl-core');

app.use('/Font', express.static('Font'));
 
// dlfun()
// async function dlfun() {
//   const videoUrl = 'https://www.youtube.com/watch?v=oglRrpIsVaE';

//   try {
//     const audio = await ytdl2(videoUrl, { filter: 'audioonly' });
    
//     if (audio) {
//       console.log('the returned url is', audio)
//     } else {
//       console.log('Error: Audio URL is undefined');
//     }
//   } catch (error) {
//     console.error('Error in dlfun:', error);
//   }
  
  // Download audio only
  // const audio = await ytdl2(videoUrl, { filter: 'audioonly' });
  // // const audio2 = ytdl2(videoUrl, { filter: 'audioonly' });
  
  // console.log('the returned url is',audio); 
  // audio.pipe(fs.createWriteStream('sample-audio2.mp3'));
  
  // audio.on('finish', () => {
  //   console.log('Audio downloaded successfully');
  // });
  
  // audio.on('error', (error) => {
  //   console.error('Error downloading audio:', error);
  // });
// }
   
async function getAudioUrl(videoUrl) { 

  try {
    // Get info about the video
    const info = await ytdl2.getInfo(videoUrl);

    // Filter only audio formats
    const audioFormats = ytdl2.filterFormats(info.formats, 'audioonly');

    // Find the highest quality audio format
    const highestQualityAudio = audioFormats.reduce((highest, current) => {
        return current.bitrate > highest.bitrate ? current : highest;
    });

    // Return the URL of the highest quality audio format
    console.log(highestQualityAudio)
    return highestQualityAudio.url;
} catch (error) {
    console.error('Error fetching audio URL:', error);
    throw error;
}
   
}
 
app.use(express.json());
// app.use(bodyParser.json());

async function ytsearch(query) {
  const videos = await YouTube.search(query,);
  // console.log(videos)
  return videos.map((m) => ({
    id: m.id,
    title: m.title,
    channel: m.channel.name
  }));
}



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.post('/search', async (req, res) => {
  console.log("initated")
  const query = req.body.query;
  if (!query) {
    console.log("Query is required")

    return res.status(400).json({ error: 'Query is required' });
  }
  try {
    const results = await ytsearch(query);
    // console.log(results)
    res.json(results);
  } catch (error) {
    console.log("Failed to search YouTube")

    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

app.post('/fetch-urls', async (req, res) => {
  const { videoUrl } = req.body;

  try {
    // Validate YouTube URL
    if (!ytdl2.validateURL(videoUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get audio URL using the helper function
    const audioUrl = await getAudioUrl(videoUrl);

    // Send the audio URL back to the client
    res.json({ url: audioUrl });
  } catch (error) {
    console.error('Error fetching audio URL:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/suggested-audios', async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }
  try {
    const suggestedVideos = await getSuggestedVideos(videoId);
    res.json(suggestedVideos);
  } catch (error) {
    console.error('Error fetching suggested videos:', error.message);
    res.status(500).json({ error: error.message });
  }
});



async function getSuggestedVideos(videoId) {
  try {
    const info = await ytdl2.getInfo(videoId);
    // console.log(info);
    const suggestedVideos = info.related_videos.map(video => ({
      id: video.id,
      title: video.title,
      subtitle: video.author.name,
      thumbnail: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`
    }));
    console.log(suggestedVideos)
    return suggestedVideos;
  } catch (error) {
    console.error('Error fetching suggested videos:', error);
    return [];
  }
}

// Example usage:
// getSuggestedVideos('PR-J1MSbwAo').then(suggestedVideos => {
//   console.log(suggestedVideos);
// });







app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
