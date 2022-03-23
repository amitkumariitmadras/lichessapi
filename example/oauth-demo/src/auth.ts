import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';

export const lichessHost = 'https://lichess.org';
export const scopes = ['board:play'];
export const clientId = 'lichess-oauth-demo';
export const clientUrl = `${location.protocol}//${location.host}/`;

export interface Me {
  id: string;
  username: string;
  httpClient: HttpClient;
}

export class Auth {
  oauth = new OAuth2AuthCodePKCE({
    authorizationUrl: `${lichessHost}/oauth`,
    tokenUrl: `${lichessHost}/api/token`,
    clientId,
    scopes,
    redirectUrl: clientUrl,
    onAccessTokenExpiry: refreshAccessToken => refreshAccessToken(),
    onInvalidGrant: _retry => {},
  });

  me?: Me;
  error?: string;

  async init() {
    try {
      try {
        const accessContext = await this.oauth.getAccessToken();
        if (accessContext) await this.fetchMe();
      } catch (err) {
        this.error = '' + err;
      }
      if (!this.me) {
        const hasAuthCode = await this.oauth.isReturningFromAuthServer();
        if (hasAuthCode) await this.fetchMe();
      }
    } catch (err) {
      this.error = '' + err;
    }
  }

  async login() {
    await this.oauth.fetchAuthorizationCode();
  }

  async logout() {
    if (this.me) await this.me.httpClient(`${lichessHost}/api/token`, { method: 'DELETE' });
    localStorage.clear();
    this.error = undefined;
    this.me = undefined;
  }

  fetch = (path: string, ...args: any[]) => this.me?.httpClient(`${lichessHost}${path}`, args);

  private fetchMe = async () => {
    const fetch = this.oauth.decorateFetchHTTPClient(window.fetch);
    const res = await fetch(`${lichessHost}/api/account`);
    const me = await res.json();
    if (me.error) throw me.error;
    me.httpClient = fetch;
    this.me = me;
    this.error = undefined;
  };
}
