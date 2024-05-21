const fs = require('fs').promises;
const readline = require('readline');
const iconv = require('iconv-lite');
const chardet = require('chardet');

const convertTimecode = (subTimecode) => {
  try {
    const times = subTimecode.match(/\{(\d+)\}\{(\d+)\}/);
    const startFrame = parseInt(times[1], 10);
    const endFrame = parseInt(times[2], 10);


    const startTime = startFrame / 25;
    const endTime = endFrame / 25;


    const toSrtTime = (seconds) => {
      const date = new Date(0);
      date.setSeconds(seconds);
      return date.toISOString().substr(11, 12).replace('Z', '').replace('.', ',');
    };

    return `${toSrtTime(startTime)} --> ${toSrtTime(endTime)}`;
  } catch (error) {
    console.log(error);
  }

};


const convertSubToSrt = async (filePath) => {
  try {
    const encoding = await chardet.detectFile(filePath);


    const fileStream = await fs.open(filePath, 'r');
    const rl = readline.createInterface({
      input: fileStream.createReadStream().pipe(iconv.decodeStream(encoding)),
      crlfDelay: Infinity
    });

    let srtContent = '';

    for await (const line of rl) {
      const match = line.match(/\{(\d+)\}\{(\d+)\}(.+)/);
      if (match) {
        const timecode = convertTimecode(match[0]);
        const text = match[3].replace(/\{.*?\}/g, '');

        srtContent += `${timecode}\n`;
        srtContent += `${text}\n\n`;
      }
    }

    await fileStream.close();
    return srtContent;
  } catch (error) {
    console.log(error);
  }

};




module.exports = convertSubToSrt;

