declare module 'mssql' {
    export interface config {
      user: string;
      password: string;
      server: string;
      database: string;
      port?: number;
      options?: {
        instancename?: string;
        encrypt?: boolean;
        trustServerCertificate?: boolean;
        integratedSecurity?: boolean;
        cryptoCredentialsDetails?: {
          minVersion?: string;
          maxVersion?: string;
        };
      };
      authentication?: {
        type: string;
      };
    }
  
    export interface ConnectionPool {
      transaction(): unknown;
      connect(): Promise<void>;
      close(): Promise<void>;
      request(): Request;
    }
  
    export interface Request {
      input(name: string, value: any): Request;
      query(queryString: string): Promise<QueryResult>;
    }
  
    export interface QueryResult {
      recordset: any[];
      recordsets: any[][];
      rowsAffected: number[];
      output?: Record<string, any>;
    }
  
    export function connect(config: config): Promise<ConnectionPool>;
  }
  