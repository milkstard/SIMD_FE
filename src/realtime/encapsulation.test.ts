// @vitest-environment node
import { ESLint } from 'eslint';

// Loading the flat config and typescript-eslint is slow on a cold start, so share one instance.
const COLD_START_MS = 60_000;
const eslint = new ESLint();

async function lint(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
}

describe('realtime encapsulation lint rule', { timeout: COLD_START_MS }, () => {
  it('flags a deep realtime import outside realtime/', async () => {
    const messages = await lint(
      "import { useSignalRConnection } from '@/realtime/useSignalRConnection';\nvoid useSignalRConnection;\n",
      'src/features/demo/Bad.tsx',
    );
    expect(messages).toHaveLength(1);
  });

  it('flags importing SignalR outside realtime/', async () => {
    const messages = await lint(
      "import { HubConnection } from '@microsoft/signalr';\nexport type T = HubConnection;\n",
      'src/features/demo/Bad.tsx',
    );
    expect(messages).toHaveLength(1);
  });

  it('allows the public @/realtime entry point', async () => {
    const messages = await lint(
      "import { useWatchIncident } from '@/realtime';\nvoid useWatchIncident;\n",
      'src/features/demo/Good.tsx',
    );
    expect(messages).toHaveLength(0);
  });

  it('allows internal imports inside realtime/', async () => {
    const messages = await lint(
      "import { useSignalRConnection } from '@/realtime/useSignalRConnection';\nvoid useSignalRConnection;\n",
      'src/realtime/Internal.ts',
    );
    expect(messages).toHaveLength(0);
  });
});
