import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatasetsController } from './datasets/datasets.controller';
import { DatasetsService } from './datasets/datasets.service';

@Module({
  imports: [],
  controllers: [AppController, DatasetsController],
  providers: [AppService, DatasetsService],
})
export class AppModule {}
