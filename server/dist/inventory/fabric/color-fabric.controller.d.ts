import { Repository } from 'typeorm';
import { ColorFabric } from './color-fabric.entity';
export declare class ColorFabricController {
    private readonly repo;
    constructor(repo: Repository<ColorFabric>);
    list(): Promise<ColorFabric[]>;
}
