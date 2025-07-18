// src/datasets/datasets.service.ts
import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

interface Dataset {
  id: string;
  name: string;
  filePath: string;
  hasBeenDownloaded: boolean;
  size?: number;
  magnetLink?: string;
}

@Injectable()
export class DatasetsService {
  private datasets: Map<string, Dataset> = new Map();

  constructor() {
    this.initMockData();
  }

  private initMockData() {
    // Dossier pour tes fichiers de test
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Crée le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const mockDatasets: Dataset[] = [
      {
        id: 'climate-data',
        name: 'test_dataset_climate.csv',
        filePath: path.join(uploadsDir, 'test_dataset_climate.csv'),
        hasBeenDownloaded: false
      },
      {
        id: 'ocean-temperature-data',
        name: 'test_dataset_ocean.csv',
        filePath: path.join(uploadsDir, 'test_dataset_ocean.csv'),
        hasBeenDownloaded: false
      }
    ];

    mockDatasets.forEach(dataset => {
      this.datasets.set(dataset.id, dataset);
    });
  }

  findById(id: string): Dataset | undefined {
    return this.datasets.get(id);
  }

  fileExists(id: string): boolean {
    const dataset = this.datasets.get(id);
    return dataset ? fs.existsSync(dataset.filePath) : false;
  }

  addMagnetLink(datasetId: string, magnetLink: string): boolean {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) return false;

    dataset.magnetLink = magnetLink;
    dataset.hasBeenDownloaded = true;
    
    return true;
  }

  getAllDatasets(): Dataset[] {
    return Array.from(this.datasets.values());
  }
}
