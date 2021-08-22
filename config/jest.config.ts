/* eslint-env node */

import path from 'path';
import { Config } from '@jest/types';

const dirRoot = (...segs: string[]) => path.join(__dirname, '..', ...segs);

export default async (): Promise<Config.InitialOptions> => {
  const config: Config.InitialOptions = {
    rootDir: dirRoot(),
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    globals: {
      'ts-jest': {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    },
    setupFilesAfterEnv: [
      '<rootDir>/config/jest.setup.ts',
    ],
  };

  return config;
};
