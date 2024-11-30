import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const extractValuesFromHTML = (html) => {
    const $ = cheerio.load(html);
    const extractedValues = { TID: null, KEY: null, CDN_DOMAIN: null };

    $('script').each((i, script) => {
        const scriptContent = $(script).html();
        const tidMatch = scriptContent.match(/p\['TID'\]\s*=\s*(\d+);/);
        const keyMatch = scriptContent.match(/p\['KEY'\]\s*=\s*"(\d+)"/);
        const cdnMatch = scriptContent.match(/p\['CDN_DOMAIN'\]\s*=\s*'([^']+)';/);

        if (tidMatch) extractedValues.TID = tidMatch[1];
        if (keyMatch) extractedValues.KEY = keyMatch[1];
        if (cdnMatch) extractedValues.CDN_DOMAIN = cdnMatch[1];
    });

    return extractedValues;
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { urlToBypass } = req.body;

    if (!urlToBypass) {
        return res.status(400).json({ error: "No URL provided" });
    }

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(urlToBypass);
        const html = await page.content();
        const extractedValues = extractValuesFromHTML(html);

        await browser.close();

        if (Object.values(extractedValues).some((value) => value !== null)) {
            return res.status(200).json(extractedValues);
        } else {
            return res.status(500).json({ error: "Failed to extract values" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "An error occurred while processing the request" });
    }
}
