import { Module } from '@nestjs/common';
import { AppController } from './controller/app.controller';
import {GlobalsService} from "./globals";
import {BrowserVideoService} from "./service/browserVideoService";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [GlobalsService, BrowserVideoService],
})
export class AppModule {}
