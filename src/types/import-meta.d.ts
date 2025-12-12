type ImportMetaEnv = Record<string, string | undefined>;

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
