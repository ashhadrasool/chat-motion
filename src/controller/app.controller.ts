import {Controller, Get, Post, Res, UploadedFile, UseInterceptors} from '@nestjs/common';
import { Response } from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import csvParser from 'csv-parser';
import {GlobalsService} from "../globals";
import {BrowserVideoService} from "../service/browserVideoService";
import * as stream from "stream";

@Controller('video')
export class AppController {
  constructor(private readonly globalService: GlobalsService, private readonly browserVideoService: BrowserVideoService) {}

  @Get()
  getHello(): string {
    return  "hello";
  }


  @Post()
  @UseInterceptors(FileInterceptor('csvFile'))
  async uploadFile(@UploadedFile() file, @Res() res: Response) {
    // const csvPath = path.join(this.globalService.uploadPath, file.filename);
    const webmContent = await this.generateVideoFromCSV(file);

    res.set({
      'Content-Type': 'video/webm',
      'Content-Length': webmContent.length.toString(),
    });

    return res.send(webmContent);
  }

  private async generateVideoFromCSV(file: File): Promise<any> {
    const csvContent = await this.readCSV(file);
    const delay = 1.0;
    return await this.browserVideoService.generateVideo(delay, csvContent);
  }

  private async readCSV(file) {

    return new Promise((resolve, reject) => {

      const csvContent: any[] = [];
      const csvRows = [];
      const fileContents = file.buffer.toString('utf8');

      const bufferStream = new stream.PassThrough();
      bufferStream.end(fileContents);

      bufferStream
          .pipe(csvParser())
          .on('data', (row) => {
            csvContent.push(row);
          })
          .on('end', () => {
            resolve(csvContent);
          })
          .on('error', (error) => {
            reject(error);
          });
    });
  }
}
