import * as client from '@/api/client';
import { config } from '@/app/config';
import { createConnection } from './createConnection';

// The real builder can't resolve a relative hub URL outside a browser, so record the calls on a fake.
const builder = vi.hoisted(() => ({
  withUrl: vi.fn(),
  withAutomaticReconnect: vi.fn(),
  build: vi.fn(() => ({ fake: true })),
}));
vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: class {
    withUrl(...args: unknown[]) {
      builder.withUrl(...args);
      return this;
    }
    withAutomaticReconnect() {
      builder.withAutomaticReconnect();
      return this;
    }
    build() {
      return builder.build();
    }
  },
}));

describe('createConnection', () => {
  it('targets the hub with automatic reconnect and the MSAL token factory', async () => {
    vi.spyOn(client, 'getToken').mockResolvedValue('token-1');

    const connection = createConnection();

    expect(connection).toEqual({ fake: true });
    expect(builder.withAutomaticReconnect).toHaveBeenCalledTimes(1);
    const [url, options] = builder.withUrl.mock.calls[0] as [
      string,
      { accessTokenFactory: () => Promise<string> },
    ];
    expect(url).toBe(config.hubUrl);
    await expect(options.accessTokenFactory()).resolves.toBe('token-1');
  });
});
