import { HubConnectionBuilder, type HubConnection } from '@microsoft/signalr';
import { getToken } from '@/api/client';
import { config } from '@/app/config';

/** Builds the app's one hub connection. Kept separate so tests can replace it. */
export function createConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(config.hubUrl, { accessTokenFactory: () => getToken() })
    .withAutomaticReconnect()
    .build();
}
