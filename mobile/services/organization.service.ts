import { apiClient } from './api.client';

export interface OrganizationBranch {
  id: string;
  name: string;
  city: string;
  district: string;
  org_type: string;
}

export const organizationService = {
  getNames: (orgType?: 'STK' | 'OFFICIAL'): Promise<string[]> => {
    const query = orgType ? `?org_type=${orgType}` : '';
    return apiClient.get<string[]>(`/organizations/names${query}`);
  },

  getCities: (name: string, orgType?: 'STK' | 'OFFICIAL'): Promise<string[]> => {
    const query = orgType ? `&org_type=${orgType}` : '';
    return apiClient.get<string[]>(
      `/organizations/cities?name=${encodeURIComponent(name)}${query}`
    );
  },

  getBranches: (
    name: string,
    city: string,
    orgType?: 'STK' | 'OFFICIAL'
  ): Promise<OrganizationBranch[]> => {
    const query = orgType ? `&org_type=${orgType}` : '';
    return apiClient.get<OrganizationBranch[]>(
      `/organizations/branches?name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}${query}`
    );
  },
};
