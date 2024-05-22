require("dotenv").config({ path: "./.env" });
const express = require("express");
const landing = require('./landingTemplate');
const { publishToCentral } = require('stremio-addon-sdk')
const app = express();
const fs = require("fs");
const subsrt = require("subtitle-converter");
const iconv = require("iconv-lite");
const unzipper = require("unzipper");
const axios = require('axios')
const subtitlePageFinder = require("./scraper");
const MANIFEST = require('./manifest');
const NodeCache = require("node-cache");
const rateLimit = require('express-rate-limit')
const header = require("./header");
const path = require("path");
const chardet = require('chardet');
const ass2srt = require('ass-to-srt');
const sub2srt = require("./subtosrt");
const sslfix = require("./sslfix");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})



const myCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 });



const CACHE_MAX_AGE = 4 * 60 * 60; // 4 hours in seconds
const STALE_REVALIDATE_AGE = 4 * 60 * 60; // 4 hours
const STALE_ERROR_AGE = 7 * 24 * 60 * 60; // 7 days

var respond = function (res, data) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(data);
  } catch (error) {
    console.log(error);
  }

};

app.get('/', function (req, res) {
  try {
    res.set('Content-Type', 'text/html');
    res.send(landing(MANIFEST));
  } catch (error) {
    console.log(error);
  }

});

app.get("/:userConf?/configure", function (req, res) {
  try {
    if (req.params.userConf !== "addon") {
      res.redirect("/addon/configure")
    } else {
      res.set('Content-Type', 'text/html');
      const newManifest = { ...MANIFEST };
      res.send(landing(newManifest));
    }
  } catch (error) {
    console.log(error);
  }

});

app.get('/manifest.json', function (req, res) {
  try {
    const newManifest = { ...MANIFEST };
    // newManifest.behaviorHints.configurationRequired = false;
    newManifest.behaviorHints.configurationRequired = true;
    respond(res, newManifest);
  } catch (error) {
    console.log(error);
  }

});

app.get('/:userConf/manifest.json', function (req, res) {
  try {
    const newManifest = { ...MANIFEST };
    if (!((req || {}).params || {}).userConf) {
      newManifest.behaviorHints.configurationRequired = true;
      respond(res, newManifest);
    } else {
      newManifest.behaviorHints.configurationRequired = false;
      respond(res, newManifest);
    }
  } catch (error) {
    console.log(error);
  }

});




async function getsub(subFilePath) {
  try {
    if (fs.existsSync(subFilePath)) {
      var text = "";
      const encoding = chardet.detectFileSync(subFilePath);

      if (encoding != "UTF-8") {
        var buffer = fs.readFileSync(subFilePath);
        text = iconv.decode(buffer, 'win1254')

      }
      else {
        text = fs.readFileSync(subFilePath).toString("utf8")
      }

      var foundext = path.extname(subFilePath)


      if (foundext != ".srt") {
        if (foundext == ".ass") {
          let data = ass2srt(text);
          return { text: data, ext: foundext };
        } else if (foundext == ".sub") {

          var data = await sub2srt(subFilePath);
          return { text: data, ext: foundext };
        }

        const outputExtension = '.srt'
        const options = {
          removeTextFormatting: true,
        };

        const { subtitle } = subsrt.convert(text, outputExtension, options);
        return { text: subtitle, ext: foundext };

      } else {
        return { text: text, ext: foundext };
      }
    }

  } catch (error) {
    if (error) return console.log(error);
  }

}


function CheckFolderAndFiles() {
  try {
    const folderPath = './subs/';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const files = fs.readdirSync(folderPath);

    if (files.length > 500) {
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isFile()) {
          fs.unlinkSync(filePath);
        } else if (fileStats.isDirectory()) {
          // Dizin içinde dosya varsa onları da silmek için
          fs.rmdirSync(filePath, { recursive: true });
        }
      });
    }
  } catch (error) {
    if (error) console.log(error);
  }

}


async function SeriesAndMoviesCheck(altid, episode) {
  try {

    var returnValue = '';
    var files = fs.readdirSync(path.join(__dirname, "subs", altid));
    var filess = files;
    const stats = fs.lstatSync(path.join(__dirname, "subs", altid, files[0]));
    if (stats.isDirectory()) {
      files = fs.readdirSync(path.join(__dirname, "subs", altid, files[0]));
      altid = path.join(altid, filess[0]);

    }
    for await (var value of files) {
      var checkValue = String(value).trim().toLowerCase();
      //MOVİE 
      if (episode == 0) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;
      }
      //SERİES
      else if (checkValue.includes("e" + episode)) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;

      } else if (checkValue.includes("b" + episode)) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;
      }
      else if (checkValue.includes("_" + episode + "_")) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;

      }
      else if (checkValue.includes("x" + episode)) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;

      }
      else if (checkValue.includes(episode)) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;
      }
      else if (files.length == 1) {
        returnValue = path.join(__dirname, "subs", altid, value);
        break;
      }
    }
    return returnValue;


  } catch (error) {
    if (error) console.log(error);
  }

}

async function SubtitleAvailableCheck(altid, episode) {
  try {
    let subFilePath = await SeriesAndMoviesCheck(altid, episode);

    let textt = await getsub(subFilePath);

    //delete zip file

    if (fs.existsSync(path.join(__dirname, "subs", altid + ".zip"))) {
      fs.rmSync(path.join(__dirname, "subs", altid + ".zip"));
    }

    if (textt && typeof (textt.text) !== "undefined") {
      return textt.text
    }
  } catch (error) {
    console.log(error);
  }

}

app.get('/download/:idid\-:sidid\-:altid\-:episode', limiter, async function (req, res) {
  try {
    var episode = req.params.episode;

    if (episode < 10) episode = "0" + episode;

    CheckFolderAndFiles();
    res.set('Cache-Control', `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate:${STALE_REVALIDATE_AGE}, stale-if-error:${STALE_ERROR_AGE}`);

    // Check if there are subtitles available
    if (fs.existsSync(path.join(__dirname, "subs", req.params.altid))) {
      let checkSubtitle = await SubtitleAvailableCheck(req.params.altid, episode);
      if (checkSubtitle !== '') return res.send(checkSubtitle)
    } else {
      var response = await axios({ ...sslfix, url: process.env.PROXY_URL + '/ind', method: "POST", headers: header, data: `idid=${req.params.idid}&altid=${req.params.altid}&sidid=${req.params.sidid}`, responseType: 'arraybuffer', responseEncoding: 'utf8' });

      if (response && response.status === 200 && response.statusText === 'OK') {
        fs.writeFileSync(path.join(__dirname, "subs", req.params.altid + ".zip"), response.data, { encoding: 'utf8' })
        //extract zip
        fs.createReadStream(path.join(__dirname, "subs", req.params.altid + ".zip")).pipe(unzipper.Extract({ path: path.join(__dirname, "subs", req.params.altid) })).on('error', (err) => console.error('Hata:', err)).on("entry", (entry) => { entry.pipe(fs.createWriteStream(entry.path, { encoding: 'utf8' })); }).on("finish", async () => {
          let checkSubtitle = await SubtitleAvailableCheck(req.params.altid, episode);
          if (checkSubtitle !== '') return res.send(checkSubtitle)
        });
      }
    }

  } catch (err) {
    console.log(err)
    return res.send("Couldn't get the subtitle.")
  }

});

app.get('/:userConf?/subtitles/:type/:imdbId/:query?.json', limiter, async function (req, res) {
  try {
    let { type, imdbId, query } = req.params
    let videoId = imdbId.split(":")[0]
    let season = Number(imdbId.split(":")[1])
    let episode = Number(imdbId.split(":")[2])

    if (myCache.has(req.params.imdbId)) {
      respond(res, myCache.get(req.params.imdbId));
    } else {
      const subtitles = await subtitlePageFinder(videoId, type, season, episode);
      if (subtitles.length > 0) {
        myCache.set(req.params.imdbId, { subtitles: subtitles, cacheMaxAge: CACHE_MAX_AGE, staleRevalidate: STALE_REVALIDATE_AGE, staleError: STALE_ERROR_AGE }, 15 * 60) // 15 mins
        respond(res, { subtitles: subtitles, cacheMaxAge: CACHE_MAX_AGE, staleRevalidate: STALE_REVALIDATE_AGE, staleError: STALE_ERROR_AGE });
      } else {
        myCache.set(req.params.imdbId, { subtitles: subtitles }, 2 * 60) // 2 mins
        respond(res, { subtitles: subtitles });
      }
    }

  } catch (err) {
    console.log(err);
    respond(res, { "subtitles": [] });
  }
})


app.get('*', function (req, res) {
  res.redirect("/")
});

if (module.parent) {
  module.exports = app;
} else {
  app.listen(process.env.PORT || 7000, function () {
    console.log(`extension running port : ${process.env.PORT}`)
  });
}

//publish to stremio store
//publishToCentral(process.env.HOST_URL + "/manifest.json");
