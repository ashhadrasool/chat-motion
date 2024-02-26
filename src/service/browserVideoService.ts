// canvas.service.ts

import {Injectable, OnModuleInit} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import {GlobalsService} from "../globals";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import * as path from "path";


@Injectable()
export class BrowserVideoService implements OnModuleInit {

    browser: puppeteer.Browser;

    constructor(private readonly globalsService: GlobalsService) {}

    async onModuleInit() {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null
        });
        console.log('Globals initialized');
    }

    async generateVideo(delay, csvContent) {
        const names = Array.from(new Set(csvContent.map(o => o.sender)).keys());

        const page = await this.browser.newPage();
        await page.goto(this.globalsService.websitePath);

        await page.evaluate(() => {
            const inputFields = document.querySelectorAll<HTMLInputElement>('[id="newInputBox"]');
            //ts-ignore
            inputFields.forEach(field => field.value = '');
        });

        //change animation speed 1 represents 1 sec
        await page.evaluate((delay) => {
            // Find the input element by its ID and change its value
            // @ts-ignore
            document.getElementById('animation_speed').value = delay * 10;
        }, delay);

        await page.evaluate((names) => {
            const avatorIds = ['avatorA_name', 'avatorB_name', 'avatorC_name', 'avatorD_name'];

            for(let i = 0; i < names.length; i++){
                const avatorNameInput = document.getElementById(avatorIds[i]) as HTMLInputElement;
                if (avatorNameInput) {
                    // @ts-ignore
                    avatorNameInput.value = names[i];
                }
            }
        }, names);

        await page.evaluate(({names, csvContent}) => {
            let additional = csvContent.length - 7;
            while (additional > 0 ){
                const ele = document.querySelector('[id="dynamicCheck"]');
                ele.querySelector<HTMLButtonElement>('[type="button"]').click();
                additional--;
            }

            const inputFields = document.querySelectorAll<HTMLInputElement>('[id="newInputBox"]');

            //ts-ignore
            let i = 0;
            inputFields.forEach(field => {
                field.value = csvContent[i].message;
                i++;
            });

            const selects = document.querySelectorAll('select');
            const values = ['A', 'B', 'C', 'D'];

            i = 0;
            selects.forEach(select => {
                const nameIndex = names.indexOf( csvContent[i].sender );
                select.value = values[nameIndex];
                select.dispatchEvent(new Event('change'));
                i++;
            });

        }, {names, csvContent});

        const randomGuid: string = uuidv4();
        const folderPath = `/tmp/${randomGuid}`;

        if(!fs.existsSync(folderPath))
            fs.mkdirSync(folderPath);

        const client = await page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: folderPath,
        });

        await page.click('button[id="save_canvas"]');
        await this.waitWhileFolderIsEmpty(folderPath);

        const filePath = path.join(folderPath, 'chat_animation.webm');
        const webmContent = await this.readFileToBuffer(filePath);

        await page.close();

        fs.unlinkSync(filePath);

        return webmContent;
    }

    async isFolderEmpty(folderPath){
        const files = await fs.promises.readdir(folderPath);
        return files.length === 0;
    };

    async waitWhileFolderIsEmpty(folderPath){
        while(true){

            if(!(await this.isFolderEmpty(folderPath))){
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    async readFileToBuffer(filePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}
