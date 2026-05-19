import { Info, CreateInfoData, UpdateInfoData } from '../entities/Info.js';

export interface IInfoRepository {
  findAll(): Promise<Info[]>;
  findById(id: number): Promise<Info | undefined>;
  create(data: CreateInfoData): Promise<Info>;
  update(id: number, data: UpdateInfoData): Promise<Info | undefined>;
  delete(id: number): Promise<boolean>;
}
