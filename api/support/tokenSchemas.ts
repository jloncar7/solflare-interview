import { z } from 'zod';

/** Solana addresses (mints and wallets) are base58 strings of 32-44 characters. */
const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Native SOL as described in the assignment. */
export const SOL_TOKEN = {
    name: 'Solana',
    symbol: 'SOL',
    mint: '11111111111111111111111111111111',
} as const;

/** Price details of a token. Only the fields we assert on are required, the rest is allowed through. */
export const priceSchema = z.looseObject({
    price: z.number().nonnegative(),
});

/**
 * One token of the portfolio. price and coingeckoId must be present on every token,
 * but they may be null (devnet tokens usually have no market price).
 */
export const tokenSchema = z.looseObject({
    mint: z.string().regex(BASE58_ADDRESS, 'mint must be a base58 address'),
    name: z.string(),
    symbol: z.string(),
    totalUiAmount: z.number().finite().nonnegative(),
    coingeckoId: z.string().nullable(),
    price: priceSchema.nullable(),
});

export const tokensResponseSchema = z.looseObject({
    tokens: z.array(tokenSchema),
});

export type Token = z.infer<typeof tokenSchema>;
export type TokensResponse = z.infer<typeof tokensResponseSchema>;

/** Validates a response body and throws a readable error listing every field that does not match the schema. */
export function parseTokensResponse(body: unknown): TokensResponse {
    const result = tokensResponseSchema.safeParse(body);
    if (!result.success) {
        throw new Error(`Response does not match the tokens schema:\n${z.prettifyError(result.error)}`);
    }
    return result.data;
}

/**
 * Removes the fields that are expected to change between two otherwise identical responses (the price)
 * and sorts the tokens by mint, so two responses can be compared with a deep equal.
 */
export function withoutPrices(tokens: Token[]): Omit<Token, 'price'>[] {
    return tokens
        .map(({ price: _price, ...token }) => token)
        .sort((first, second) => first.mint.localeCompare(second.mint));
}
