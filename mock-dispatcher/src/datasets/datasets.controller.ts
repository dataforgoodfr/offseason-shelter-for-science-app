// src/datasets/datasets.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  BadRequestException,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { DatasetsService } from './datasets.service';
import { statSync, createReadStream } from 'fs';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  async getDataset(
    @Query('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!id) {
      throw new BadRequestException('Dataset ID is required');
    }

    const dataset = this.datasetsService.findById(id);
    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${id} not found`);
    }

    // Si première demande ET fichier existe → serve le fichier
    if (!dataset.hasBeenDownloaded && this.datasetsService.fileExists(id)) {
      console.log(`📦 Serving file for dataset ${id}`);

      // Récupérer la taille (synchrone)
      const stats = statSync(dataset.filePath);
      const fileSize = stats.size;

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${dataset.name}"`,
        'Content-Length': fileSize,
      });

      const stream = createReadStream(dataset.filePath);
      return new StreamableFile(stream);
    }

    // Si déjà téléchargé → retourne le magnet link
    if (dataset.hasBeenDownloaded && dataset.magnetLink) {
      console.log(`🧲 Returning magnet link for dataset ${id}`);

      return {
        id: dataset.id,
        name: dataset.name,
        magnetLink: dataset.magnetLink,
        isFirstDownload: false,
      };
    }

    // Si pas encore téléchargé mais fichier n'existe pas
    if (!this.datasetsService.fileExists(id)) {
      throw new NotFoundException(
        `File not found for dataset ${id}. Please upload it to uploads/ folder.`,
      );
    }

    throw new BadRequestException('Dataset state is inconsistent');
  }

  @Post('magnet-link')
  async postMagnetLink(
    @Body() body: { datasetId: string; magnetLink: string; clientId: string },
  ): Promise<{ success: boolean; message: string }> {
    const { datasetId, magnetLink, clientId } = body;

    if (!datasetId || !magnetLink || !clientId) {
      throw new BadRequestException(
        'datasetId, magnetLink, and clientId are required',
      );
    }

    const success = this.datasetsService.addMagnetLink(datasetId, magnetLink);

    if (!success) {
      throw new NotFoundException(`Dataset with ID ${datasetId} not found`);
    }

    console.log(
      `🧲 Magnet link received for dataset ${datasetId} from client ${clientId}`,
    );

    return {
      success: true,
      message: `Magnet link stored for dataset ${datasetId}`,
    };
  }

  @Get('all')
  async getAllDatasets() {
    const datasets = this.datasetsService.getAllDatasets();
    return datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      size: dataset.size,
      hasBeenDownloaded: dataset.hasBeenDownloaded,
      fileExists: this.datasetsService.fileExists(dataset.id),
      magnetLink: dataset.magnetLink ? '***' : null,
    }));
  }
}
