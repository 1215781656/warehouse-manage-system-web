import { ColorFabric } from '../fabric/color-fabric.entity';
export declare class Inventory {
    id: string;
    colorFabric: ColorFabric;
    totalInboundQuantity: number;
    totalOutboundQuantity: number;
    currentQuantity: number;
    totalInboundWeight: string;
    totalOutboundWeight: string;
    currentWeight: string;
    safetyStock: number;
}
