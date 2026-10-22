// ESLint 9 flat config — replaces .eslintrc.json ("extends":
// "next/core-web-vitals"); eslint-config-next 16 only ships flat configs.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextCoreWebVitals,
  {
    // New in eslint-config-next 16: React Compiler readiness rules. This app
    // is on React 18 without the compiler, so they're guidance rather than
    // bugs — kept visible as warnings instead of failing lint over ~300
    // existing effects.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'],
  },
]

export default config
