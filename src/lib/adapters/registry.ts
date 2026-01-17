import type { Platform } from '@/types/platform';
import type { PlatformAdapter } from './base';

/**
 * Adapter registry for lazy-loading platform adapters
 */
class AdapterRegistry {
  /** Registered adapter instances */
  private adapters = new Map<Platform, PlatformAdapter>();

  /** Adapter factory functions for lazy loading */
  private factories = new Map<Platform, () => Promise<PlatformAdapter>>();

  /** Loading promises to prevent duplicate loads */
  private loadingPromises = new Map<Platform, Promise<PlatformAdapter>>();

  /**
   * Register an adapter instance directly
   */
  register(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.platformId, adapter);
  }

  /**
   * Register a lazy-loaded adapter factory
   * The factory will be called only when the adapter is first requested
   */
  registerLazy(platform: Platform, factory: () => Promise<PlatformAdapter>): void {
    this.factories.set(platform, factory);
  }

  /**
   * Get an adapter by platform ID
   * Will lazy-load if a factory is registered
   */
  async getAsync(platform: Platform): Promise<PlatformAdapter> {
    // Check if already loaded
    const existing = this.adapters.get(platform);
    if (existing) {
      return existing;
    }

    // Check if currently loading
    const loading = this.loadingPromises.get(platform);
    if (loading) {
      return loading;
    }

    // Check for factory
    const factory = this.factories.get(platform);
    if (!factory) {
      throw new Error(`No adapter registered for platform: ${platform}`);
    }

    // Load the adapter
    const loadPromise = factory().then((adapter) => {
      this.adapters.set(platform, adapter);
      this.loadingPromises.delete(platform);
      return adapter;
    });

    this.loadingPromises.set(platform, loadPromise);
    return loadPromise;
  }

  /**
   * Get an adapter synchronously (throws if not loaded)
   */
  get(platform: Platform): PlatformAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Adapter not loaded for platform: ${platform}. Use getAsync() instead.`);
    }
    return adapter;
  }

  /**
   * Check if an adapter is registered
   */
  has(platform: Platform): boolean {
    return this.adapters.has(platform) || this.factories.has(platform);
  }

  /**
   * Check if an adapter is loaded (not just registered)
   */
  isLoaded(platform: Platform): boolean {
    return this.adapters.has(platform);
  }

  /**
   * Get all loaded adapters
   */
  getAll(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all registered platform IDs
   */
  getAllPlatforms(): Platform[] {
    const platforms = new Set<Platform>();
    for (const platform of this.adapters.keys()) {
      platforms.add(platform);
    }
    for (const platform of this.factories.keys()) {
      platforms.add(platform);
    }
    return Array.from(platforms);
  }

  /**
   * Unregister an adapter
   */
  unregister(platform: Platform): void {
    this.adapters.delete(platform);
    this.factories.delete(platform);
    this.loadingPromises.delete(platform);
  }

  /**
   * Clear all registered adapters
   */
  clear(): void {
    this.adapters.clear();
    this.factories.clear();
    this.loadingPromises.clear();
  }
}

/**
 * Singleton adapter registry instance
 */
export const adapterRegistry = new AdapterRegistry();

// ============================================
// Register Platform Adapters (Lazy Loading)
// ============================================

/**
 * Register all platform adapters with lazy loading
 * Adapters are only instantiated when first accessed
 */
function registerAllAdapters(): void {
  // Instacart (OAuth 2.0) - also handles Costco
  adapterRegistry.registerLazy('instacart', async () => {
    const { instacartAdapter } = await import('./instacart');
    return instacartAdapter;
  });

  adapterRegistry.registerLazy('costco', async () => {
    const { costcoAdapter } = await import('./instacart');
    return costcoAdapter;
  });

  // DoorDash (JWT authentication)
  adapterRegistry.registerLazy('doordash', async () => {
    const { doordashAdapter } = await import('./doordash');
    return doordashAdapter;
  });

  // Uber Eats (OAuth 2.0 with PKCE)
  adapterRegistry.registerLazy('ubereats', async () => {
    const { ubereatsAdapter } = await import('./ubereats');
    return ubereatsAdapter;
  });

  // Amazon / Amazon Fresh (OAuth 2.0 + AWS Signature V4)
  adapterRegistry.registerLazy('amazon', async () => {
    const { amazonAdapter } = await import('./amazon');
    return amazonAdapter;
  });

  adapterRegistry.registerLazy('amazon_fresh', async () => {
    const { amazonFreshAdapter } = await import('./amazon');
    return amazonFreshAdapter;
  });

  // Walmart+ (Session-based)
  adapterRegistry.registerLazy('walmart', async () => {
    const { walmartAdapter } = await import('./walmart');
    return walmartAdapter;
  });

  // Shipt (Session-based) - also handles Target orders
  adapterRegistry.registerLazy('shipt', async () => {
    const { shiptAdapter } = await import('./shipt');
    return shiptAdapter;
  });

  // Drizly (Session-based)
  adapterRegistry.registerLazy('drizly', async () => {
    const { drizlyAdapter } = await import('./drizly');
    return drizlyAdapter;
  });

  // Total Wine (Onfleet API)
  adapterRegistry.registerLazy('totalwine', async () => {
    const { totalwineAdapter } = await import('./totalwine');
    return totalwineAdapter;
  });

  // Sam's Club (Session-based, may delegate to Instacart)
  adapterRegistry.registerLazy('samsclub', async () => {
    const { samsclubAdapter } = await import('./samsclub');
    return samsclubAdapter;
  });
}

// Register adapters on module load
registerAllAdapters();

/**
 * Register an adapter
 */
export function registerAdapter(adapter: PlatformAdapter): void {
  adapterRegistry.register(adapter);
}

/**
 * Get an adapter by platform (sync - throws if not loaded)
 */
export function getAdapter(platform: Platform): PlatformAdapter {
  return adapterRegistry.get(platform);
}

/**
 * Get an adapter by platform (async - lazy loads if needed)
 */
export async function getAdapterAsync(platform: Platform): Promise<PlatformAdapter> {
  return adapterRegistry.getAsync(platform);
}

/**
 * Get all loaded adapters
 */
export function getAllAdapters(): PlatformAdapter[] {
  return adapterRegistry.getAll();
}

/**
 * Check if an adapter is registered
 */
export function hasAdapter(platform: Platform): boolean {
  return adapterRegistry.has(platform);
}
