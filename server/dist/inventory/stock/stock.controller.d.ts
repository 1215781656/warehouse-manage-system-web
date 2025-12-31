import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
export declare class StockController {
    private readonly repo;
    constructor(repo: Repository<Inventory>);
    list(productSpec?: string, composition?: string, weight?: string, width?: string, color?: string, colorNo?: string): Promise<Inventory[]>;
    get(id: string): Promise<Inventory | null>;
}
