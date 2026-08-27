const DB_NAME = 'ssreporter-vrm-models';
const STORE_NAME = 'models';
const DB_VERSION = 1;

export interface ImportedVrmModelMeta {
  id: string;
  name: string;
  size: number;
  importedAt: number;
}

interface StoredVrmModelRecord {
  meta: ImportedVrmModelMeta;
  blob: Blob;
}

function createImportedModelId(filename: string): string {
  const base = filename
    .replace(/\.vrm$/i, '')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 48);
  const suffix = Date.now().toString(36);
  return base ? `${base}-${suffix}` : `vrm-${suffix}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => {
      reject(request.error ?? new Error('无法打开 VRM 模型数据库。'));
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = run(store);
        let result: T;

        request.onerror = () => {
          reject(request.error ?? new Error('VRM 模型数据库操作失败。'));
        };
        request.onsuccess = () => {
          result = request.result as T;
        };
        transaction.oncomplete = () => {
          db.close();
          resolve(result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error('VRM 模型数据库事务失败。'));
        };
      }),
  );
}

export async function listImportedVrmModels(): Promise<ImportedVrmModelMeta[]> {
  const records = await runTransaction<StoredVrmModelRecord[]>(
    'readonly',
    (store) => store.getAll(),
  );
  return records
    .map((record) => record.meta)
    .sort((a, b) => b.importedAt - a.importedAt);
}

export async function getImportedVrmModelBlob(modelId: string): Promise<Blob | null> {
  const record = await runTransaction<StoredVrmModelRecord | undefined>(
    'readonly',
    (store) => store.get(modelId),
  );
  return record?.blob ?? null;
}

export async function saveImportedVrmModel(file: File): Promise<ImportedVrmModelMeta> {
  if (!file.name.toLowerCase().endsWith('.vrm')) {
    throw new Error('请选择 .vrm 文件。');
  }
  const meta: ImportedVrmModelMeta = {
    id: createImportedModelId(file.name),
    name: file.name,
    size: file.size,
    importedAt: Date.now(),
  };
  await runTransaction('readwrite', (store) =>
    store.put({ meta, blob: file } satisfies StoredVrmModelRecord),
  );
  return meta;
}

export async function deleteImportedVrmModel(modelId: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(modelId));
}
