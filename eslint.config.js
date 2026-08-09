import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Shared base options for @typescript-eslint/no-magic-numbers — see per-scope
// overrides below for HTTP status codes (server routes) and visual/rendering
// geometry (SVG icons, map markers, chart pixel math), neither of which
// benefits from being pulled into named constants.
const magicNumberOptions = {
  ignore: [-1, 0, 1, 2],
  ignoreArrayIndexes: true,
  ignoreDefaultValues: true,
  ignoreClassFieldInitialValues: true,
  ignoreEnums: true,
  ignoreNumericLiteralTypes: true,
  ignoreReadonlyClassProperties: true,
  enforceConst: true,
}

// Every literal status code passed to HttpError(...)/res.status(...) in server/src.
const HTTP_STATUS_CODES = [201, 204, 400, 401, 403, 404, 409, 413, 422, 500, 502, 503]

// Files whose numeric literals are SVG path/marker geometry or map/chart
// rendering tuning (zoom levels, pixel offsets, stroke widths) rather than
// unnamed business thresholds.
const VISUAL_RENDERING_FILES = [
  'src/components/map/leafletIcons.ts',
  'src/components/map/MapArea.tsx',
  'src/components/map/MapHelpers.tsx',
  'src/components/plan/stages/weather/WmoConditionIcon.tsx',
  'src/components/trip/ElevationProfile.tsx',
  'src/components/trip/GpxMapSection.tsx',
  'src/components/plan/stages/route/RouteMapCard.tsx',
  'src/components/plan/PlanAccessError.tsx',
  'src/components/plan/stages/route/ZonesOverlay.tsx',
]

// Files whose numeric literals are coefficients of a transcribed reference
// formula (astronomical algorithm, unit-conversion factor) — naming each one
// would fragment a formula meant to be read as a whole. See the file-level
// comments in each for the source reference.
const TRANSCRIBED_FORMULA_FILES = [
  'src/lib/sun.ts',
  'src/lib/units.ts',
]

export default defineConfig([
  globalIgnores(['dist', 'server/dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-magic-numbers': ['warn', magicNumberOptions],
      complexity: ['warn', 15],
      'max-lines-per-function': [
        'warn',
        { max: 30, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    // JSX markup (verbose className props, nested elements) inflates line
    // count without the cognitive load of imperative logic — give components
    // more room than plain .ts logic/utility files.
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': [
        'warn',
        { max: 70, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  {
    files: ['server/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        { ...magicNumberOptions, ignore: [...magicNumberOptions.ignore, ...HTTP_STATUS_CODES] },
      ],
    },
  },
  {
    files: VISUAL_RENDERING_FILES,
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
  {
    files: TRANSCRIBED_FORMULA_FILES,
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
])
