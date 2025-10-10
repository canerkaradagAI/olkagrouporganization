
// Organization Portal Types

export interface Employee {
  currAccCode: string;
  firstLastName: string;
  organization?: string;
  positionId?: number;
  locationId?: number;
  isBlocked: boolean;
  isManager: boolean;
  managerId?: string;
  brandId?: number;
  position?: Position;
  location?: Location;
  brand?: Brand;
  manager?: Employee;
  subordinates?: Employee[];
  assignments?: PositionAssignment[];
}

export interface Position {
  positionId: number;
  positionName: string;
  locationId: number;
  brandId: number;
  departmentId: number;
  location?: Location;
  brand?: Brand;
  department?: Department;
  employees?: Employee[];
  assignments?: PositionAssignment[];
}

export interface Department {
  departmentId: number;
  departmentName: string;
  positions?: Position[];
}

export interface Brand {
  brandId: number;
  brandName: string;
  positions?: Position[];
  employees?: Employee[];
}

export interface Location {
  locationId: number;
  locationName: string;
  positions?: Position[];
  employees?: Employee[];
}

export interface AssignmentTypeLookup {
  assignmentTypeId: number;
  assignmentTypeName: string;
  assignments?: PositionAssignment[];
}

export interface PositionAssignment {
  assignmentId: number;
  positionId: number;
  currAccCode: string;
  startDate: Date;
  endDate?: Date;
  assignmentType: string;
  position?: Position;
  employee?: Employee;
  assignmentTypeLookup?: AssignmentTypeLookup;
}

// Role Management Types
export interface Role {
  roleId: number;
  roleName: string;
  description?: string;
  isActive: boolean;
  userRoles?: UserRole[];
  roleScreenPermissions?: RoleScreenPermission[];
}

export interface Screen {
  screenId: number;
  screenName: string;
  screenPath: string;
  description?: string;
  roleScreenPermissions?: RoleScreenPermission[];
}

export interface Permission {
  permissionId: number;
  permissionName: string;
  roleScreenPermissions?: RoleScreenPermission[];
}

export interface RoleScreenPermission {
  roleId: number;
  screenId: number;
  permissionId: number;
  role?: Role;
  screen?: Screen;
  permission?: Permission;
}

export interface UserRole {
  userId: string;
  roleId: number;
  user?: any;
  role?: Role;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface EmployeeFormData {
  currAccCode: string;
  firstLastName: string;
  organization?: string;
  positionId?: number;
  locationId?: number;
  isBlocked: boolean;
  isManager: boolean;
  managerId?: string;
  brandId?: number;
}

export interface PositionFormData {
  positionName: string;
  locationId: number;
  brandId: number;
  departmentId: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number;
  totalPositions: number;
  totalDepartments: number;
  totalLocations: number;
  totalBrands: number;
  blockedEmployees: number;
  managersCount: number;
}
