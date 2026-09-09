import { jest } from '@jest/globals';

export const setStringAsync = jest.fn(async (_text: string) => true);
export const getStringAsync = jest.fn(async () => '');
export const hasStringAsync = jest.fn(async () => true);
