export function removeEmptySearchFields<T extends object>(search: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(search).flatMap(([key, value]) => {
      if (value === null || value === undefined) return [];
      if (typeof value === 'string') return value.trim() ? [[key, value.trim()]] : [];
      if (Array.isArray(value)) {
        const values = value.filter((item) => item !== '' && item !== undefined && item !== null);
        return values.length ? [[key, values]] : [];
      }
      return [[key, value]];
    }),
  ) as Partial<T>;
}
export function matches(value: string, filter?: string) {
  return !filter || value.toLowerCase().includes(filter.trim().toLowerCase());
}
export function inviteURL(id: string) {
  return `${window.location.origin}/invitation/${encodeURIComponent(id)}`;
}
export function effectiveSystems(
  user: import('@/types').PortalUser,
  customer?: import('@/types').Customer,
) {
  return user.status === '正常'
    ? user.systems.filter(
        (binding) =>
          binding.enabled &&
          binding.bound &&
          customer?.systems.some(
            (system) =>
              system.code === binding.code && system.enabled && system.org === binding.org,
          ),
      )
    : [];
}
