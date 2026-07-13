import { apiGet } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

export interface CatalogPermission {
  intPermission: number
  permissionName: string
}

// A "page" is a checkbox group title within a subModule — e.g. subModule
// 'Academic Core' has pages 'Intake Master' and 'Faculty Master', each with
// their own Create/Update/Delete/View permissions.
export interface CatalogPage {
  page: string
  permissions: CatalogPermission[]
}

export interface CatalogSubModule {
  subModule: string
  pages: CatalogPage[]
}

export interface CatalogModule {
  mainModule: string
  subModules: CatalogSubModule[]
}

// Small representative subset so the permission wizard still works offline
// in mock mode. Real data comes from GET /api/v1/users/admin/permission-groups/permissions
// once NEXT_PUBLIC_AUTH_MOCK=false. intPermission ids below match the real
// catalog's ids (stable identifiers); mainModule/subModule/page names mirror
// the real "Academics" / "Administration" / "System" grouping.
const mockCatalog: CatalogModule[] = [
  {
    mainModule: 'System',
    subModules: [
      {
        subModule: 'System',
        pages: [
          {
            page: 'System',
            permissions: [
              { intPermission: 25, permissionName: 'Super Admin - All Permissions' },
              { intPermission: 27, permissionName: 'Create Campus' },
              { intPermission: 30, permissionName: 'View Campus' },
            ],
          },
        ],
      },
    ],
  },
  {
    mainModule: 'Academics',
    subModules: [
      {
        subModule: 'Academic Core',
        pages: [
          {
            page: 'Faculty Master',
            permissions: [
              { intPermission: 39, permissionName: 'Create Faculty' },
              { intPermission: 41, permissionName: 'Update Faculty' },
              { intPermission: 42, permissionName: 'View Faculty' },
            ],
          },
          {
            page: 'Intake Master',
            permissions: [
              { intPermission: 46, permissionName: 'View Intake' },
            ],
          },
        ],
      },
      {
        subModule: 'Course Unit Master',
        pages: [
          {
            page: 'Course Units',
            permissions: [
              { intPermission: 34, permissionName: 'View Course Unit' },
            ],
          },
        ],
      },
      {
        subModule: 'Programme Master',
        pages: [
          {
            page: 'Programme Master',
            permissions: [
              { intPermission: 50, permissionName: 'View Programme' },
            ],
          },
        ],
      },
    ],
  },
  {
    mainModule: 'Administration',
    subModules: [
      {
        subModule: 'User Management',
        pages: [
          {
            page: 'Employees',
            permissions: [
              { intPermission: 1, permissionName: 'Create Employee' },
              { intPermission: 4, permissionName: 'View Employee' },
            ],
          },
        ],
      },
    ],
  },
]

export function getPermissionCatalog(): Promise<CatalogModule[]> {
  if (MOCK_AUTH) return Promise.resolve(mockCatalog)
  return apiGet<CatalogModule[] | null>('/api/v1/users/admin/permission-groups/permissions').then(data => data ?? [])
}
