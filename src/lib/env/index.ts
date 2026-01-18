/**
 * Environment variable utilities
 * Re-exports main env utilities plus production-specific validation
 */

// Re-export from main env module
export { env, isDevelopment, isProduction, isTest } from '../env';

// Re-export production validation utilities
export {
  getProductionEnv,
  getProductionReadinessReport,
  isProductionReady,
  type ProductionEnv,
  type ProductionReadinessReport,
  type ValidationResult,
  validateProductionEnv,
  validateProductionEnvOrExit,
} from './production';
