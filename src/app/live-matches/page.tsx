import { promises as fs } from 'fs';
import path from 'path';
import LiveMatchesClient from './LiveMatchesClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let defaultVersion = "v4";
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'settings.json');
    const data = await fs.readFile(filePath, 'utf8');
    const settings = JSON.parse(data);
    if (settings.defaultVersion) {
      defaultVersion = settings.defaultVersion;
    }
  } catch (e) {
    // If file doesn't exist or is invalid, fallback to "v4"
  }

  return <LiveMatchesClient initialVersion={defaultVersion as any} />;
}
