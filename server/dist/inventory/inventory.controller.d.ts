import { Repository } from 'typeorm';
import { Inventory } from './stock/inventory.entity';
export declare class InventoryController {
    private readonly repo;
    constructor(repo: Repository<Inventory>);
    list(): Promise<Inventory[]>;
}
