export interface Config {
    replayApiUrl: string;
    localGraphqlUrl: string;
    productionGraphqlUrl: string;
    localAuth: string;
    productionAuth: string;
}
export declare function loadConfig(): Config;
