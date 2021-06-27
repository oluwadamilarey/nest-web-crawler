import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePetInput } from './dto/create-pet-input';
import { Pet } from './pet.entity';
import * as puppeteer from 'puppeteer';
import { Cache } from 'cache-manager';
import cheerio from 'cheerio';
import { request } from 'http';
import fetch from 'node-fetch';

@Injectable()
export class PetsService {
  constructor(
    @InjectRepository(Pet) private petsRepository: Repository<Pet>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getPage(): Promise<string> {
    try {
      const savedPage = await this.cacheManager.get(
        'https://www.w3schools.com',
      );
      if (savedPage) {
        console.log('using cached Data');
        return JSON.stringify(savedPage);
      }
      const response = await fetch('https://www.w3schools.com');
      const body = await response.text();
      const $ = cheerio.load(body);
      const webpageTitle = $('title').text();
      const metaDescription = $('meta').each;

      const metaDesc = () => {
        for (var i = 0; i < metaDescription.length; i++) {
          if (metaDescription[i].getAttribute('name') == 'Description') {
            console.log('it matched');
            return metaDescription[i].getAttribute('content');
          }
        }
      };

      const webpage = {
        title: webpageTitle,
        Description: metaDesc,
      };

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto('https://www.w3schools.com');

      const page_title: string = await page.title();

      const largest_image: string = await page.evaluate(() => {
        return [...document.getElementsByTagName('img')].sort(
          (a, b) =>
            b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight,
        )[0].src;
      });

      const description: string = await page.evaluate(() => {
        var metaTags = document.getElementsByTagName('meta');

        for (var i = 0; i < metaTags.length; i++) {
          if (metaTags[i].getAttribute('name') == 'Description') {
            return metaTags[i].getAttribute('content');
          }
        }
      });

      interface PageData {
        PageTitle: string;
        Description: string;
        LargestImage: string;
      }

      const pageData: PageData = {
        PageTitle: page_title,
        Description: description,
        LargestImage: largest_image,
      };

      const pageString = `Page title: ${pageData.PageTitle}  
      Page description:${pageData.Description}  
      Largest image  ${pageData.LargestImage}`;

      await this.cacheManager.set('https://www.w3schools.com', pageString, {
        ttl: 20,
      });

      return `Page title: ${webpage.title}  
      Page description:${webpage.Description}  
      Largest image  ${pageData.LargestImage}`;
    } catch (e) {
      return e.message;
    }
  }

  createPet(createPetInput: CreatePetInput): Promise<Pet> {
    const newPet = this.petsRepository.create(createPetInput); // newPet = new Pet();
    return this.petsRepository.save(newPet); // Insert
  }

  async findAll(): Promise<Pet[]> {
    return this.petsRepository.find(); // SELECT * pet
  }

  findOne(id: number): Promise<Pet> {
    return this.petsRepository.findOneOrFail(id);
  }
}
