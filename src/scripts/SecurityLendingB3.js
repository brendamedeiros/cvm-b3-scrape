const puppeteer = require('puppeteer');
const fs = require('fs');
const { formattedDate } = require('./Helper');

const dateArg = process.argv.slice(2)[0];
const downloadArg = dateArg === undefined ? formattedDate(true) : dateArg;

const baseURL = `http://arquivos.b3.com.br/tabelas/LendingOpenPosition/${downloadArg}?lang=pt`;
const downloadDir = `${__dirname}/tmp/`;

puppeteer.launch().then(async browser => {
    let page = await browser.newPage();
    return new Promise(async (resolve, reject) => {
        console.info(`Reaching ${baseURL}`);
        await page.goto(baseURL, { timeout: 0, waitUntil: 'networkidle2'});

        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadDir,
        });

        let [downloadFileBtn] = await page.$x("//a[contains(., 'Baixar arquivo completo')]");
        if (downloadFileBtn) {
            await downloadFileBtn.click();
        } else {
            throw new Error('Download button doesn\'t exists. Ending application');
        }

        setTimeout(() => browser.close(), 5000);
        resolve();
    });
});