import { Response } from 'express';
import { ExportService, ExportColumn } from './export.service';
export declare class ExportController {
    private readonly svc;
    constructor(svc: ExportService);
    exportExcel(body: {
        entity: 'inbound' | 'outbound' | 'stock' | 'colorFabric';
        ids: string[];
        columns: ExportColumn[];
        filename?: string;
    }, asyncFlag?: string, res?: Response): Promise<Response<any, Record<string, any>> | undefined>;
    taskStatus(id: string): Promise<{
        state: "pending" | "running" | "finished" | "failed";
        progress: number;
        error: string | undefined;
    }>;
    taskDownload(id: string, res: Response): Promise<void>;
}
export declare class ReportControllerAlias {
    private readonly svc;
    constructor(svc: ExportService);
    exportByTypeAlias(type: string, ids: string[] | string, idsBracket: string[] | string | undefined, res: Response, isAll?: string, asyncFlag?: string, query?: Record<string, any>): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare class ReportExportController {
    private readonly svc;
    constructor(svc: ExportService);
    exportByType(type: string, ids: string[] | string, idsBracket: string[] | string | undefined, res: Response, isAll?: string, asyncFlag?: string, query?: Record<string, any>): Promise<Response<any, Record<string, any>> | undefined>;
}
