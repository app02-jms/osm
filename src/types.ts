export interface User {
  username: string;
  displayName: string;
  role: string;
}

export interface Session {
  user: User;
  expiresAt: number;
}

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  module: string;
  label: string;
  children: NavChild[];
}

export interface BreadcrumbItem {
  label: string;
}

export interface PageTab {
  key: string;
  label: string;
}
