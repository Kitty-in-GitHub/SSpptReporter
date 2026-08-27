import type { Dispatch, SetStateAction } from 'react';
import type { AppSettings, ChatProviderOption } from '../../types/settings';

export type SetSettings = Dispatch<SetStateAction<AppSettings>>;

export type ApiKeyProvider = Exclude<ChatProviderOption, 'gemini-nano'>;
