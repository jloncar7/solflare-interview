import type { APIRequestContext, APIResponse } from '@playwright/test';
import { logger } from './apiLogger';

/** Wallet address given in the assignment. Can be overridden with the WALLET_ADDRESS environment variable. */
export const WALLET_ADDRESS = process.env.WALLET_ADDRESS ?? 'HuiTegTpNAU7EJXvn95HKEWBdFMtWZYko4yoFVQyCKUS';

export const TOKENS_ENDPOINT = '/v3/portfolio/tokens';

export type Network = 'mainnet' | 'devnet' | 'testnet';

/**
 * Thin wrapper around the "GET /v3/portfolio/tokens/{address}" endpoint.
 * The request context passed in already carries the "Authorization: Bearer {uuid4}" header.
 */
export class TokensApiClient {
    constructor(private readonly request: APIRequestContext) {}

    /**
     * Fetches the tokens of a wallet. When network is omitted the query parameter is not sent at all.
     * Any string is accepted for network and address so that negative tests can send invalid values.
     */
    async getTokens(options: { address?: string; network?: Network | string } = {}): Promise<APIResponse> {
        const { address = WALLET_ADDRESS, network } = options;
        const params = network === undefined ? undefined : { network };
        return this.get(`${TOKENS_ENDPOINT}/${encodeURIComponent(address)}`, params);
    }

    /** Sends a GET request to any path, used to call endpoints that do not exist. */
    async get(path: string, params?: Record<string, string>): Promise<APIResponse> {
        const query = params ? `?${new URLSearchParams(params)}` : '';
        logger.info(`GET ${path}${query}`);
        const response = await this.request.get(path, { params });
        logger.info(`Response ${response.status()} ${response.statusText()} for GET ${path}${query}`);
        return response;
    }
}
