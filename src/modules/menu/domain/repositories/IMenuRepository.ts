import { Menu, CreateMenuData, UpdateMenuData } from '../entities/Menu.js';

export interface IMenuRepository {
  findById(id: number): Promise<Menu | undefined>;
  findAll(): Promise<Menu[]>;
  create(data: CreateMenuData): Promise<Menu>;
  update(id: number, data: UpdateMenuData): Promise<Menu | undefined>;
  delete(id: number): Promise<boolean>;
  hasChildren(parentId: number): Promise<boolean>;
  findByName(nombre: string): Promise<Menu | undefined>;
}
