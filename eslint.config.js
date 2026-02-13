import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
    // グローバル無視設定
    {
        ignores: ['node_modules/', 'dist/', '*.js', '!eslint.config.js'],
    },
    // ESLint推奨ルール
    eslint.configs.recommended,
    // TypeScript推奨ルール
    ...tseslint.configs.recommended,
    // Prettierとの競合を無効化
    eslintConfigPrettier,
    // プロジェクト固有の設定
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // 未使用変数: _プレフィックスは許可
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
);
