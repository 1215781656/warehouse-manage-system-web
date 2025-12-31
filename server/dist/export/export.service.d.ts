import { Repository } from 'typeorm';
import { InboundOrder } from '../inventory/inbound/inbound.entity';
import { OutboundOrder } from '../inventory/outbound/outbound.entity';
import { Inventory } from '../inventory/stock/inventory.entity';
import { ColorFabric } from '../inventory/fabric/color-fabric.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Receivable } from '../finance/receivable/receivable.entity';
import { Payable } from '../finance/payable/payable.entity';
export type ExportColumn = {
    key: string;
    header: string;
    type?: 'text' | 'number' | 'date';
};
export type ExportFormat = 'xlsx' | 'csv';
export type ExportField = {
    key: string;
    title: string;
    width?: number;
    formatter?: (value: any) => string;
};
export interface ExportConfig {
    fields: ExportField[];
    sheetName?: string;
    style?: {
        headerBgColor?: string;
        fontFamily?: string;
    };
}
type ExportPayload = {
    entity: 'inbound' | 'outbound' | 'stock' | 'colorFabric' | 'receivable' | 'payable';
    ids: string[];
    columns: ExportColumn[];
    filename?: string;
};
type ExportTask = {
    id: string;
    payload: ExportPayload;
    state: 'pending' | 'running' | 'finished' | 'failed';
    progress: number;
    filePath?: string;
    error?: string;
};
export declare class ExportService {
    private readonly inRepo;
    private readonly outRepo;
    private readonly invRepo;
    private readonly cfRepo;
    private readonly rcRepo;
    private readonly pyRepo;
    private readonly taskMap;
    private readonly logger;
    constructor(inRepo: Repository<InboundOrder>, outRepo: Repository<OutboundOrder>, invRepo: Repository<Inventory>, cfRepo: Repository<ColorFabric>, rcRepo: Repository<Receivable>, pyRepo: Repository<Payable>);
    makeFilename(provided: string | undefined, entity: string): string;
    makeFilenameWithExt(provided: string | undefined, entity: string, format: ExportFormat): string;
    private formatDate;
    streamExcel(payload: ExportPayload, res: Response): Promise<void>;
    exportByEntityWithConfig(entity: ExportPayload['entity'], ids: string[], cfg: ExportConfig, format: ExportFormat, res: Response, filename?: string): Promise<void>;
    writeXlsxFromObjects(rows: Array<Record<string, any>>, cfg: ExportConfig, res: Response): Promise<void>;
    writeCsvFromObjects(rows: Array<Record<string, any>>, res: Response): void;
    enqueue(payload: ExportPayload): Promise<ExportTask>;
    getTask(id: string): ExportTask | undefined;
    runTask(id: string): Promise<void>;
    validatePayload(p: ExportPayload): void;
    fetchRows(entity: ExportPayload['entity'], ids: string[]): Promise<any[]>;
    pickValue(row: any, key: string): any;
    normalizeValue(v: any, type?: ExportColumn['type']): string | number | Date;
    applyFormats(ws: ExcelJS.Worksheet, columns: ExportColumn[]): void;
    autofitColumns(ws: ExcelJS.Worksheet): void;
    findIdsByFilter(entity: ExportPayload['entity'], filters: Record<string, any>): Promise<string[]>;
    validateIdsAgainstFilter(entity: ExportPayload['entity'], ids: string[], filters: Record<string, any>): Promise<void>;
}
export {};
