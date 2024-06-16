const Axios = require('axios').default;
const header = require("./header")
const cheerio = require('cheerio');
require("dotenv").config({ path: "./.env" });
const sslfix = require("./sslfix");
const axiosRetry = require("axios-retry").default;
const { setupCache } = require("axios-cache-interceptor");


const instance = Axios.create();
const axios = setupCache(instance);
axiosRetry(axios, { retries: 2 });

async function mainPageFinder(imdbId) {
    try {
        var editedId = imdbId.substring(2);

        const response = await axios({ ...sslfix, url: process.env.PROXY_URL + `/things_.php?t=99&term=${editedId}`, method: "GET", headers: header })


        if (response.status === 200) {
            const mainPageURL = process.env.PROXY_URL + response.data[0].url
            return mainPageURL
        } else {
            return mainPageURL = ""
        }
    } catch (error) {
        console.log("mainPageFinder not found", error);
    }
}

async function subIDfinder(subLink) {
    try {


        const response = await axios({ ...sslfix, url: subLink, method: "GET", headers: header });


        $ = cheerio.load(response.data)
        let subIDs = []

        $('form[action="/ind"] > div').each((i, section) => {
            let idid = $(section).children('input[name="idid"]').attr('value')
            let altid = $(section).children('input[name="altid"]').attr('value')
            let sidid = $(section).children('input[name="sidid"]').attr('value')
            subIDs.push({ idid, altid, sidid })
        }).get()

        return subIDs

    } catch (e) {
        console.log("Sub IDs could not found!", e)
    }
}


async function subtitlePageFinder(imdbId, type, season, episode) {

    try {

        let subtitlesData = [];

        //GOES TO THE MAIN PAGE FOR THE MOVIE/SERIES.
        const mainPageURL = await mainPageFinder(imdbId)
        if (typeof(mainPageURL) != "undefined" && mainPageURL.length > 0) {

            const mainPageHTML = await axios({ ...sslfix, url: mainPageURL, method: "GET", headers: header })


            $ = cheerio.load(mainPageHTML.data)

            //SCRAPES SUBTITLE PAGE LINK, SUBTITLE LANGUAGE AND CD NUMBER FOR MOVIES. 
            //IT DOESN'T SCRAPE IF CD NUMBER MORE THAN 1. 
            //IT DOESN'T SCRAPE IF THE SUBTITLE IS NOT TURKISH.
            if (type === "movie") {
                $('.altyazi-list-wrapper  > div > div').each((i, section) => {
                    let subPageURL = $(section).children('.alisim').children('.fl').children('a').attr('href');
                    let subLang = $(section).children('.aldil').children('span').attr('class')
                    let cd = Number($(section).children('.alcd').text().trim())

                    if (subLang === "flagtr" && subPageURL !== undefined && cd === 1) {

                        subPageURL = process.env.PROXY_URL + subPageURL
                        subLang = subLang.substring(4)
                        subtitlesData.push({ lang: subLang, pageUrl: subPageURL })
                    }
                }).get()


                //SCRAPES SUBTITLE PAGE URL, SUBTITLE LANGUAGE, SEASON AND EPISODE NUMBER. IT LISTS ALSO SUBTITLE PACKS IF THE SEASON NUMBER MATCHS.
            } else {
                $('.altyazi-list-wrapper  > div > div').each((i, section) => {
                    let subPageURL = $(section).children('.alisim').children('.fl').children('a').attr('href');
                    let subLang = $(section).children('.aldil').children('span').attr('class');
                    let seasonNumber = $(section).children('.alcd').children('b').first().text().trim();
                    let episodeNumber = $(section).children('.alcd').children('b').last().text().trim();

                    if (seasonNumber.indexOf("0") === 0) {
                        seasonNumber = seasonNumber.substring(1)
                    }

                    if (episodeNumber.indexOf("0") === 0) {
                        episodeNumber = (episodeNumber.substring(1))
                    }

                    seasonNumber = Number(seasonNumber);

                    if (episodeNumber === "Paket" || episodeNumber === "paket") {
                        episodeNumber = "Paket";
                    } else if (episode <= Number(episodeNumber.split("~")[1]) && episode >= Number(episodeNumber.split("~")[0])) {
                        episodeNumber = episode;
                    } else if (episode <= Number(episodeNumber.split("-")[1]) && episode >= Number(episodeNumber.split("-")[0])) {
                        episodeNumber = episode;
                    } else {
                        episodeNumber = Number(episodeNumber);
                    }

                    if (subLang === "flagtr" && subPageURL !== undefined && season === seasonNumber) {

                        if (episode === episodeNumber || episodeNumber === "Paket") {
                            subPageURL = process.env.PROXY_URL + subPageURL
                            subLang = subLang.substring(4)
                            subtitlesData.push({ lang: subLang, pageUrl: subPageURL, season: seasonNumber, episode: episodeNumber })
                        }
                    }
                }).get()
            }

            //CREATES DOWNLOAD LINK FOR THE POST REQUEST.
            let stremioElements = []

            for (let i = 0; i < subtitlesData.length; i++) {
                let subIDs = await subIDfinder(subtitlesData[i].pageUrl)
                let idid = subIDs[0].idid;
                let altid = subIDs[0].altid;
                let sidid = subIDs[0].sidid;
                let lang = "tur";


                //CHECK MOVİE OR SERİES 
                if (isNaN(episode)) episode = 0;


                var url = `${process.env.HOST_URL}/download/${idid}-${sidid}-${altid}-${episode}`;


                stremioElements.push({ url, lang, id: altid, episode })
            }

            return stremioElements;

        }
    } catch (e) {
        console.error("Error happened on subtitlePageFinder", e);
    }

}

module.exports = subtitlePageFinder