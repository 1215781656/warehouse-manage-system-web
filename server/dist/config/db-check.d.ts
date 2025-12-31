import { DataSource } from 'typeorm';
export declare function verifyDatabaseConnectionWithRetry(dataSource: DataSource, retries?: number, delayMs?: number): Promise<void>;
