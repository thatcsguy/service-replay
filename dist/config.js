import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
export function loadConfig() {
    return {
        replayApiUrl: getRequiredEnv('REPLAY_API_URL'),
        localGraphqlUrl: getRequiredEnv('LOCAL_GRAPHQL_URL'),
        productionGraphqlUrl: getRequiredEnv('PRODUCTION_GRAPHQL_URL'),
        localAuth: getRequiredEnv('LOCAL_AUTH'),
        productionAuth: getRequiredEnv('PRODUCTION_AUTH'),
    };
}
