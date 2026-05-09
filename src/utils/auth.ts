import { appendJsonArrayItem, readJson, writeJson } from './storage';

export type UserRole = 'starter' | 'serviceProvider';

export type ServiceOffering = {
  name: string;
  price: string;
  description?: string;
};

export type RegistrationIdentity = {
  firstName: string;
  middleName?: string;
  lastName: string;
  country: string;
  phone: string;
  email: string;
  password: string;
};

export type StarterUser = {
  id: string;
  role: 'starter';
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  createdAt: string;
};

export type ServiceProviderUser = {
  id: string;
  role: 'serviceProvider';
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  businessName: string;
  service: string;
  category: string;
  subcategory: string;
  location: string;
  moneyRange: string;
  services: ServiceOffering[];
  availability: string;
  serviceArea: string;
  languages: string;
  createdAt: string;
};

export type AuthUser = StarterUser | ServiceProviderUser;

export type RegisterInput =
  | (RegistrationIdentity & {
      role: 'starter';
    })
  | (RegistrationIdentity & {
      role: 'serviceProvider';
      businessName: string;
      service: string;
      category: string;
      subcategory: string;
      location: string;
      moneyRange: string;
      services: ServiceOffering[];
      availability?: string;
      serviceArea?: string;
      languages?: string;
    });

export type AuthSession = {
  userId: string;
  role: UserRole;
  email: string;
  createdAt: string;
};

const USERS_KEY = 'authUsers';
const SESSION_KEY = 'authSession';

function getUsers(): AuthUser[] {
  return readJson<AuthUser[]>(USERS_KEY, []);
}

function setUsers(next: AuthUser[]): void {
  writeJson<AuthUser[]>(USERS_KEY, next);
}

function composeName(firstName: string, middleName: string | undefined, lastName: string): string {
  return [firstName.trim(), middleName?.trim() ?? '', lastName.trim()].filter(Boolean).join(' ');
}

function normalizeServiceOfferings(services: ServiceOffering[]): ServiceOffering[] {
  return services.map((service) => ({
    name: service.name.trim(),
    price: service.price.trim(),
    description: service.description?.trim() || undefined,
  }));
}

export function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(SESSION_KEY, null);
}

export function logout(): void {
  writeJson<AuthSession | null>(SESSION_KEY, null);
}

export function registerUser(input: RegisterInput): {
  ok: true;
  user: AuthUser;
} | {
  ok: false;
  message: string;
} {
  const users = getUsers();
  const email = input.email.trim().toLowerCase();

  if (!email) return { ok: false, message: 'Email is required.' };
  if (!input.firstName.trim()) return { ok: false, message: 'First name is required.' };
  if (!input.lastName.trim()) return { ok: false, message: 'Last name is required.' };
  if (!input.country.trim()) return { ok: false, message: 'Country is required.' };
  if (!input.phone.trim()) return { ok: false, message: 'Phone number is required.' };
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, message: 'An account with this email already exists.' };
  }

  const baseUser = {
    id: `user-${Date.now()}`,
    firstName: input.firstName.trim(),
    middleName: input.middleName?.trim() || undefined,
    lastName: input.lastName.trim(),
    name: composeName(input.firstName, input.middleName, input.lastName),
    country: input.country.trim(),
    phone: input.phone.trim(),
    email,
    password: input.password,
    createdAt: new Date().toISOString(),
  };

  const user: AuthUser =
    input.role === 'serviceProvider'
      ? {
          ...baseUser,
          role: 'serviceProvider',
          businessName: input.businessName.trim(),
          service: input.service.trim(),
          category: input.category.trim(),
          subcategory: input.subcategory.trim(),
          location: input.location.trim(),
          moneyRange: input.moneyRange.trim(),
          services: normalizeServiceOfferings(input.services),
          availability: input.availability?.trim() || '',
          serviceArea: input.serviceArea?.trim() || '',
          languages: input.languages?.trim() || '',
        }
      : {
          ...baseUser,
          role: 'starter',
        };

  if (input.role === 'serviceProvider') {
    if (!input.businessName.trim()) {
      return { ok: false, message: 'Business name is required.' };
    }

    if (!input.service.trim()) {
      return { ok: false, message: 'Please select a service.' };
    }

    if (!input.location.trim()) {
      return { ok: false, message: 'Location is required.' };
    }

    if (!input.moneyRange.trim()) {
      return { ok: false, message: 'Money range is required.' };
    }

    const normalizedServices = normalizeServiceOfferings(input.services);

    if (normalizedServices.length === 0) {
      return { ok: false, message: 'Add at least one service with its price.' };
    }

    if (normalizedServices.some((service) => !service.name || !service.price)) {
      return { ok: false, message: 'Each service row needs both a service name and a price.' };
    }
  }

  const next = [user, ...users];
  setUsers(next);

  return { ok: true, user };
}

export function login(emailRaw: string, passwordRaw: string): {
  ok: true;
  session: AuthSession;
} | {
  ok: false;
  message: string;
} {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;

  if (!email || !password) return { ok: false, message: 'Email and password are required.' };

  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email);

  if (!user) return { ok: false, message: 'No account found for that email.' };
  if (user.password !== password) return { ok: false, message: 'Incorrect password.' };

  const session: AuthSession = {
    userId: user.id,
    role: user.role,
    email: user.email,
    createdAt: new Date().toISOString(),
  };

  writeJson<AuthSession>(SESSION_KEY, session);
  return { ok: true, session };
}

export function seedAuthIfEmpty(): void {
  const users = getUsers();
  if (users.length > 0) return;

  const seeded: AuthUser = {
    id: 'user-seed-1',
    role: 'starter',
    firstName: 'Starter',
    middleName: undefined,
    lastName: 'Member',
    name: 'Starter Member',
    country: 'Rwanda',
    phone: '+250 7xx xxx xxx',
    email: 'starter@example.com',
    password: 'password123',
    createdAt: new Date().toISOString(),
  };

  appendJsonArrayItem<AuthUser>(USERS_KEY, seeded);
}
