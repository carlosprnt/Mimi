// Minimal ambient declarations covering the surface we use. The full
// package ships proper types — these only exist so TypeScript in the
// CI sandbox (where the package isn't installed) doesn't fail.
declare module 'expo-apple-authentication' {
  export enum AppleAuthenticationScope {
    FULL_NAME = 0,
    EMAIL = 1,
  }
  export interface AppleAuthenticationFullName {
    givenName?: string | null;
    familyName?: string | null;
    middleName?: string | null;
    nickname?: string | null;
    namePrefix?: string | null;
    nameSuffix?: string | null;
  }
  export interface AppleAuthenticationCredential {
    user: string;
    email?: string | null;
    fullName?: AppleAuthenticationFullName | null;
    identityToken: string | null;
    authorizationCode: string | null;
    state?: string | null;
    realUserStatus: number;
  }
  export function isAvailableAsync(): Promise<boolean>;
  export function signInAsync(options?: {
    requestedScopes?: AppleAuthenticationScope[];
  }): Promise<AppleAuthenticationCredential>;
}
