const puppeteer = require('puppeteer');
const extractZip = require('extract-zip');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { exit } = require('process');
const { EEXIST } = require('constants');

dotenv.config({ path: './config.env' });

const baseURL = 'https://sistemaswebb3-listados.b3.com.br/isinPage/';
const baseDir = path.resolve(__dirname, 'tmp', 'DadosCadastraisB3');
console.log(baseURL);

try {
    if (!fs.existsSync(baseDir)){
        fs.mkdirSync(baseDir, { recursive: true });
    }
} catch (err) {
    if (err.code === EEXIST) {
        console.log('It already exists');
    }
}


puppeteer.launch().then(async browser => {
    let page = await browser.newPage();

    return new Promise(async (resolve, reject) => {
        console.info(`Reaching ${baseURL}`);

        await page.goto(baseURL, { timeout: 0, waitUntil: 'networkidle2'});

        await page.waitForSelector('#accordionHeading');

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: baseDir,
        });

        await page.click('.accordion-head a[aria-controls="accordionBodyTwo"]');

        await page.waitForTimeout(5000);

        let [downloadFileBtn] = await page.$x("//a[contains(., 'Banco de Dados Completo')]");

        if (downloadFileBtn) {
            console.log("it exists");
            setTimeout(async () =>  await downloadFileBtn.click(), 5000);
        }

        page.on('requestfinished', async(request) => {
            let postData = request._postData;

            if (postData) {
                postData = postData.toString();

                if (postData.startsWith('$ni') && postData.includes('GetFileDownload')) {
                    setTimeout(() => browser.close(), 5000);
                }
            }
        });

        resolve();
    });
}).then(() => {
    fs.watch(baseDir, (eventType, filename) => {
        if (!filename.includes('crdownload')) {
            unzipFile(filename);
        }
    });
});

const unzipFile = (filename) => {
    try {
        const file = `${baseDir}/${filename}`;
        console.log(file);

        extractZip(file, { dir: baseDir });

        fs.unlink(file, (err) => console.log(err));
        exit();
    } catch (err) {
        console.log(err);
        exit();
    }
}