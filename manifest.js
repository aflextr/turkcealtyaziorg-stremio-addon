module.exports={
    id: "org.community.turkcealtyaziorg-stremio-addon",
    version: "1.1.9",
    name: "[RE] TurkceAltyazi.Org",
    logo: "https://raw.githubusercontent.com/aflextr/turkcealtyaziorg-stremio-addon/main/images/logo.png",
    description: "Bu eklenti,TurkceAltyazi.org'dan tüm Türkçe altyazıları alır ve Stremio'nuza getirir.",
    contactEmail: "eyup.elitass@gmail.com",
    types: ["movie", "series"],
    background: "https://raw.githubusercontent.com/aflextr/turkcealtyaziorg-stremio-addon/main/images/background.gif",
    resources: ["subtitles"],
    catalogs: [],
    idPrefixes: ["tt"],
    behaviorHints:{configurable : true, configurationRequired: true }
};