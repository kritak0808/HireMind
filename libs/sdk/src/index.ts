/**
 * Shared API Client wrapper for HireMind AI services
 */

export class HireMindSDK {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  protected async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Request Failed: ${response.statusText} (${response.status})`);
    }

    return response.json() as Promise<T>;
  }
}
