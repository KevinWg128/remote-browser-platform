export interface Browser {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'error';
    port: number;
    wsEndpoint?: string;
    pid?: number;
    createdAt: string;
}
