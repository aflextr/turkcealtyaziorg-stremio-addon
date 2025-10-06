require("dotenv").config({path:"./.env"});
const scrapeCookie = require("./scrapeProxyCookie");

var count = 0;
function FetchCookie() {
    scrapeCookie.fetchWithCookies(process.env.PROXY_URL).then((value)=>{
    if (value.data.length > 10) {
        if(value.status == true)
        {
            header.Cookie = value.data;
        }
        else{
            count++;
            if (count == 3) {
                return;
            }
            FetchCookie()
        }
    }
})
}

FetchCookie()



var header = {
    "Accept-Language":"tr,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "Sec-Ch-Ua-Platform":"Windows",
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    "Cookie":"",
    "Origin":process.env.PROXY_URL,
    "Referer":process.env.PROXY_URL,
}

module.exports = header;

