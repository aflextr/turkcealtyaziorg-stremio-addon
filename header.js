require("dotenv").config({path:"./.env"});

const header = {
    "Accept-Language":"tr,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "Sec-Ch-Ua-Platform":"Windows",
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
    "Cookie":"turkcealtyazi_org=%7B%22HttpHost%22%3A%22turkcealtyazi.org%22%2C%22Protokol%22%3A%22https%22%2C%22Port%22%3A443%2C%22KulAdSifre%22%3Anull%2C%22UrlAdresi%22%3A%22%5C%2Fcdn-cgi%5C%2Fchallenge-platform%5C%2Fscripts%5C%2Fjsd%5C%2Fmain.js%22%2C%22GetVeri%22%3Anull%2C%22GitOpjeId%22%3Anull%2C%22DnsAdresi%22%3A%2212%22%2C%22URL_Adresi%22%3A%22https%3A%5C%2F%5C%2Fturkcealtyazi.org%5C%2Fcdn-cgi%5C%2Fchallenge-platform%5C%2Fscripts%5C%2Fjsd%5C%2Fmain.js%22%2C%22GirisIP%22%3A%22104.21.112.1%22%7D",
    "Origin":process.env.PROXY_URL,
    "Referer":process.env.PROXY_URL,
}

module.exports = header;

