// Augment ImportMeta with `env` to avoid TypeScript errors regarding
// errors with `import.meta.env` not being defined.
interface ImportMeta {
  env: Record<string, string | undefined>;
}
