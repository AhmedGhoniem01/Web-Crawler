import fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as urlParser from "url";

//Helper function
const getUrl = (url, protocol, host) => {
    if(url.includes('http')){
        return url;
    }else if(url.startsWith("/")){
        return `${protocol}//${host}${url}`;
    }else{
        return `${protocol}//${host}/${url}`;
    }
}

const seenUrls = {};

const crawl = async(url, ignore) => {
    if(seenUrls[url]){return}

    console.log(`\nCrawling ${url}...`)
    seenUrls[url] = true;

    const {host, protocol} = urlParser.parse(url);

    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    //fetch all images in a link
    const imageUrls = $("img").map((index, image) => image.attribs.src).get();

    imageUrls.forEach(imageUrl => {
        fetch(getUrl(imageUrl, protocol, host)).then((response) => {
            console.log(`Saving this image: ${imageUrl}`)

            const imageName = path.basename(imageUrl);
            const dest = fs.createWriteStream(`images/${imageName}`);

            response.body.pipe(dest);
        })
    })

    const links = $("a").map((index, link) => link.attribs.href).get();

    links.filter((link) => link.includes(host) && !link.includes(ignore)).forEach((link) => {
        crawl(getUrl(link, protocol, host), ignore);
    })
}


crawl("http://stevescooking.blogspot.com/", "");