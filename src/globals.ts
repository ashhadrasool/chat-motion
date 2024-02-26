import * as path from "path";
import * as puppeteer from "puppeteer";


import { Injectable, OnModuleInit } from '@nestjs/common';
import fs from "fs";

@Injectable()
export class GlobalsService implements OnModuleInit{
    uploadPath: string = path.join(__dirname, 'uploads');
    // websitePath: string = 'https://chat-animator.com/';
    websitePath: string = 'http://localhost:8081/';

    async onModuleInit() {
        if(!fs.existsSync(this.uploadPath)){
            fs.mkdirSync(this.uploadPath);
        }
    }
}
