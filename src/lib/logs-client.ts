export interface LogPayload {
  tenantId: string;
  action: string;
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class LogsClient {
  private static getApiConfig() {
    return {
      endpoint: process.env.LOGS_SERVICE_URL,
      token: process.env.LOGS_SECRET_TOKEN,
      appId: process.env.NEXT_PUBLIC_APP_ID,
    };
  }

  /**
   * 📡 Envía un log de forma asíncrona (fire-and-forget) al microservicio ABDLogs
   */
  static async log(payload: LogPayload): Promise<void> {
    const { endpoint, token, appId } = this.getApiConfig();

    if (!endpoint || !token) {
      console.warn('[LogsClient] Missing configuration. Logs will not be sent.');
      return;
    }

    // Evitar bloqueos de ejecución en hilos principales del servidor
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        appId,
        createdAt: new Date(),
      }),
    }).catch(err => {
      console.error(`[LOGS_CLIENT_ERROR][${appId}] Failed to send log to central service:`, err);
    });
  }
}
