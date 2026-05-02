import '@testing-library/jest-dom';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeAll(() => {
    // Setup code
});

afterEach(() => {
    cleanup();
});

afterAll(() => {
    // Cleanup code
});