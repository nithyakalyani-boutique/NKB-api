import tseslint from 'typescript-eslint';
export default tseslint.config({ignores:['dist/**','.next/**','src/generated/**','src/lib/api/schema.d.ts']}, ...tseslint.configs.recommended, {rules:{'@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}});
