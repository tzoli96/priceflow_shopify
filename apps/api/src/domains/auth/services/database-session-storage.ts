import { Session } from '@shopify/shopify-api';
import { PrismaClient } from '@prisma/client';

/**
 * Database Session Storage
 *
 * Felelősség: Shopify OAuth session-ök tárolása PostgreSQL-ben
 *
 * Miért szükséges?
 * - A Shopify library alapértelmezetten cookie-kat használ session tároláshoz
 * - Cookie-k nem őrződnek meg cross-site OAuth redirect során
 * - Adatbázis storage megoldja ezt a problémát
 *
 * Implementálja:
 * - SessionStorage metódusok:
 *   - storeSession() - Session mentése
 *   - loadSession() - Session betöltése
 *   - deleteSession() - Session törlése
 *
 * Használat:
 * - ShopifyService inicializáláskor átadva sessionStorage paraméterként
 */
export class DatabaseSessionStorage {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Session mentése adatbázisba
   *
   * @param session - Shopify Session object
   * @returns Promise<boolean> - true ha sikeres
   *
   * OAuth folyamat során hívódik:
   * 1. beginAuth() során: még nincs accessToken, csak shop + state
   * 2. callback() után: már van accessToken
   */
  async storeSession(session: Session): Promise<boolean> {
    try {
      const sessionData = {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires,
        accessToken: session.accessToken,
        onlineAccessInfo: session.onlineAccessInfo
          ? JSON.stringify(session.onlineAccessInfo)
          : null,
      };

      await this.prisma.oAuthSession.upsert({
        where: { id: session.id },
        update: sessionData,
        create: sessionData,
      });

      console.log('[DatabaseSessionStorage] Stored session:', session.id, 'for shop:', session.shop);

      return true;
    } catch (error) {
      console.error('[DatabaseSessionStorage] Failed to store session:', error);
      return false;
    }
  }

  /**
   * Session betöltése adatbázisból
   *
   * @param id - Session ID (általában "offline_shopname.myshopify.com")
   * @returns Promise<Session | undefined>
   *
   * OAuth callback során hívódik:
   * - Library megkeresi az eredetileg tárolt session-t
   * - Validálja a state paramétert
   * - Frissíti az accessToken-nel
   */
  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const sessionRecord = await this.prisma.oAuthSession.findUnique({
        where: { id },
      });

      if (!sessionRecord) {
        console.log('[DatabaseSessionStorage] Session not found:', id);
        return undefined;
      }

      // Reconstruct Shopify Session object
      const session = new Session({
        id: sessionRecord.id,
        shop: sessionRecord.shop,
        state: sessionRecord.state,
        isOnline: sessionRecord.isOnline,
      });

      if (sessionRecord.scope) {
        session.scope = sessionRecord.scope;
      }

      if (sessionRecord.expires) {
        session.expires = sessionRecord.expires;
      }

      if (sessionRecord.accessToken) {
        session.accessToken = sessionRecord.accessToken;
      }

      if (sessionRecord.onlineAccessInfo) {
        session.onlineAccessInfo = JSON.parse(sessionRecord.onlineAccessInfo);
      }

      console.log('[DatabaseSessionStorage] Loaded session:', id, 'for shop:', session.shop);

      return session;
    } catch (error) {
      console.error('[DatabaseSessionStorage] Failed to load session:', error);
      return undefined;
    }
  }

  /**
   * Session törlése adatbázisból
   *
   * @param id - Session ID
   * @returns Promise<boolean> - true ha sikeres
   *
   * Használat:
   * - OAuth befejezése után (cleanup)
   * - App uninstall esetén
   */
  async deleteSession(id: string): Promise<boolean> {
    try {
      await this.prisma.oAuthSession.delete({
        where: { id },
      });

      console.log('[DatabaseSessionStorage] Deleted session:', id);

      return true;
    } catch (error) {
      console.error('[DatabaseSessionStorage] Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Session-ök törlése shop szerint
   *
   * @param shop - Shop domain
   * @returns Promise<boolean>
   *
   * Cleanup célokra használható
   */
  async deleteSessionsByShop(shop: string): Promise<boolean> {
    try {
      await this.prisma.oAuthSession.deleteMany({
        where: { shop },
      });

      console.log('[DatabaseSessionStorage] Deleted all sessions for shop:', shop);

      return true;
    } catch (error) {
      console.error('[DatabaseSessionStorage] Failed to delete sessions for shop:', error);
      return false;
    }
  }

  /**
   * Lejárt session-ök cleanup-ja
   *
   * Futtatható cron job-ként, hogy ne gyűljenek fel a régi session-ök
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await this.prisma.oAuthSession.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });

      console.log('[DatabaseSessionStorage] Cleaned up expired sessions:', result.count);
    } catch (error) {
      console.error('[DatabaseSessionStorage] Failed to cleanup expired sessions:', error);
    }
  }
}
