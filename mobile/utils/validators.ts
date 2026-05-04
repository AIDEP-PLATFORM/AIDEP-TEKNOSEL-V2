export const validators = {
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  password: (value: string) => value.length >= 8,
  phone: (value: string) => /^(\+90|0)?[5][0-9]{9}$/.test(value.replace(/\s/g, '')),
  required: (value: string) => value.trim().length > 0,
};
