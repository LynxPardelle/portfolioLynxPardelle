export interface ISesion {
  active: boolean;
  identity?: { name: string; email: string; role: 'ROLE_ADMIN' | 'ROLE_USER' };
}
