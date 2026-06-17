import { nanoid } from 'nanoid';

export const generatePublicId = (prefix: string) => `${prefix}_${nanoid(10)}`;
