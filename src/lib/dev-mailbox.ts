import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type DevelopmentEmail = { id: string; to: string; subject: string; html: string; createdAt: string };
const mailboxPath = join(process.cwd(), "data", "dev-mailbox.json");
let writeQueue: Promise<void> = Promise.resolve();

export async function storeDevelopmentEmail(email: Omit<DevelopmentEmail, "id" | "createdAt">) {
  const write = async () => {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    let emails: DevelopmentEmail[] = [];
    try { emails = JSON.parse(await readFile(mailboxPath, "utf8")) as DevelopmentEmail[]; } catch {}
    emails.push({ ...email, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    const temporaryPath = `${mailboxPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(emails.slice(-100), null, 2), "utf8");
    await rename(temporaryPath, mailboxPath);
  };
  writeQueue = writeQueue.catch(() => undefined).then(write);
  await writeQueue;
}

export async function getDevelopmentEmails(to: string) {
  await writeQueue.catch(() => undefined);
  try {
    const emails = JSON.parse(await readFile(mailboxPath, "utf8")) as DevelopmentEmail[];
    return emails.filter(email => email.to.toLowerCase() === to.toLowerCase()).slice(-20).reverse();
  } catch {
    return [];
  }
}
