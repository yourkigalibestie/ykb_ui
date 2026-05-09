export interface ServiceProvider {
  id: string;
  name: string;
  service: string;
  location: string;
  phone?: string;
  note: string;
}

// Mocked data: replace with real admin-managed data later.
export const serviceProviders: ServiceProvider[] = [
  {
    id: 'sp-001',
    name: 'Kigali Pro Plumbers',
    service: 'Plumbing',
    location: 'Kacyiru, Kigali',
    phone: '0790 000 001',
    note: 'Fast response for leaks and installs.',
  },
  {
    id: 'sp-002',
    name: 'SparkSafe Electricians',
    service: 'Electrical',
    location: 'Remera, Kigali',
    phone: '0788 000 002',
    note: 'Licensed electricians for home & office.',
  },
  {
    id: 'sp-003',
    name: 'CleanNest Team',
    service: 'Cleaning',
    location: 'Kigali City Center',
    phone: '0722 000 003',
    note: 'One-off cleaning or weekly subscription.',
  },
];
