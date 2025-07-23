import { useContext, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// ロールの定義
export enum Role {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  GUEST = 'guest',
}

// 権限の定義
export enum Permission {
  // 診断関連
  VIEW_DIAGNOSIS = 'view_diagnosis',
  CREATE_DIAGNOSIS = 'create_diagnosis',
  EDIT_DIAGNOSIS = 'edit_diagnosis',
  DELETE_DIAGNOSIS = 'delete_diagnosis',
  
  // テンプレート関連
  VIEW_TEMPLATE = 'view_template',
  CREATE_TEMPLATE = 'create_template',
  EDIT_TEMPLATE = 'edit_template',
  DELETE_TEMPLATE = 'delete_template',
  SHARE_TEMPLATE = 'share_template',
  
  // ユーザー管理
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  
  // 分析・レポート
  VIEW_ANALYTICS = 'view_analytics',
  CREATE_REPORT = 'create_report',
  EXPORT_REPORT = 'export_report',
  
  // システム管理
  MANAGE_SYSTEM = 'manage_system',
  VIEW_LOGS = 'view_logs',
  MANAGE_SETTINGS = 'manage_settings',
}

// ロールごとの権限マッピング
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // 全権限
    ...Object.values(Permission),
  ],
  
  [Role.TEACHER]: [
    // 診断
    Permission.VIEW_DIAGNOSIS,
    Permission.CREATE_DIAGNOSIS,
    Permission.EDIT_DIAGNOSIS,
    Permission.DELETE_DIAGNOSIS,
    
    // テンプレート
    Permission.VIEW_TEMPLATE,
    Permission.CREATE_TEMPLATE,
    Permission.EDIT_TEMPLATE,
    Permission.DELETE_TEMPLATE,
    Permission.SHARE_TEMPLATE,
    
    // 分析
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_REPORT,
    Permission.EXPORT_REPORT,
  ],
  
  [Role.STUDENT]: [
    // 閲覧のみ
    Permission.VIEW_DIAGNOSIS,
    Permission.VIEW_TEMPLATE,
  ],
  
  [Role.GUEST]: [
    // 限定的な閲覧
    Permission.VIEW_TEMPLATE,
  ],
};

// リソースベースの権限チェック
export interface ResourcePermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// 権限チェック用のカスタムフック
export const usePermission = () => {
  const { user } = useContext(AuthContext);

  // ユーザーのロールを取得
  const userRole = useMemo(() => {
    if (!user) return Role.GUEST;
    return (user.role as Role) || Role.GUEST;
  }, [user]);

  // ユーザーの権限リストを取得
  const userPermissions = useMemo(() => {
    return rolePermissions[userRole] || [];
  }, [userRole]);

  // 権限チェック関数
  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  // 複数権限のチェック（AND条件）
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // 複数権限のチェック（OR条件）
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // ロールチェック
  const hasRole = (role: Role): boolean => {
    return userRole === role;
  };

  // ロールベースの階層チェック
  const hasMinimumRole = (minimumRole: Role): boolean => {
    const roleHierarchy = [Role.GUEST, Role.STUDENT, Role.TEACHER, Role.ADMIN];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const minimumRoleIndex = roleHierarchy.indexOf(minimumRole);
    return userRoleIndex >= minimumRoleIndex;
  };

  // リソースベースの権限チェック
  const canAccessResource = (
    resourceType: string,
    resourceId: string,
    action: string
  ): boolean => {
    // 管理者は全リソースにアクセス可能
    if (hasRole(Role.ADMIN)) return true;

    // リソースタイプとアクションに基づくチェック
    switch (resourceType) {
      case 'diagnosis':
        if (action === 'view') return hasPermission(Permission.VIEW_DIAGNOSIS);
        if (action === 'edit') return hasPermission(Permission.EDIT_DIAGNOSIS);
        if (action === 'delete') return hasPermission(Permission.DELETE_DIAGNOSIS);
        break;
      
      case 'template':
        if (action === 'view') return hasPermission(Permission.VIEW_TEMPLATE);
        if (action === 'edit') {
          // 自分が作成したテンプレートのみ編集可能
          return hasPermission(Permission.EDIT_TEMPLATE) && user?.id === resourceId;
        }
        if (action === 'delete') {
          // 自分が作成したテンプレートのみ削除可能
          return hasPermission(Permission.DELETE_TEMPLATE) && user?.id === resourceId;
        }
        break;
    }

    return false;
  };

  // 条件付き権限チェック
  const hasConditionalPermission = (
    permission: Permission,
    conditions: Record<string, any>
  ): boolean => {
    if (!hasPermission(permission)) return false;

    // 条件に基づく追加チェック
    if (conditions.ownResource && conditions.resourceOwnerId !== user?.id) {
      return false;
    }

    if (conditions.timeRestriction) {
      const now = new Date();
      const { startTime, endTime } = conditions.timeRestriction;
      if (startTime && now < new Date(startTime)) return false;
      if (endTime && now > new Date(endTime)) return false;
    }

    return true;
  };

  // UIコンポーネントの表示制御
  const shouldShowComponent = (requiredPermissions: Permission[]): boolean => {
    return hasAnyPermission(requiredPermissions);
  };

  // アクションの実行可否
  const canPerformAction = (action: string, resource?: any): boolean => {
    switch (action) {
      case 'createDiagnosis':
        return hasPermission(Permission.CREATE_DIAGNOSIS);
      
      case 'editDiagnosis':
        return hasPermission(Permission.EDIT_DIAGNOSIS) && 
               (!resource || resource.createdBy === user?.id || hasRole(Role.ADMIN));
      
      case 'deleteDiagnosis':
        return hasPermission(Permission.DELETE_DIAGNOSIS) && 
               (!resource || resource.createdBy === user?.id || hasRole(Role.ADMIN));
      
      case 'shareTemplate':
        return hasPermission(Permission.SHARE_TEMPLATE);
      
      case 'exportReport':
        return hasPermission(Permission.EXPORT_REPORT);
      
      default:
        return false;
    }
  };

  return {
    user,
    userRole,
    userPermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasMinimumRole,
    canAccessResource,
    hasConditionalPermission,
    shouldShowComponent,
    canPerformAction,
  };
};

// 権限チェック用のHOC
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: Permission[],
  fallback?: React.ReactNode
) => {
  return (props: any) => {
    const { hasAnyPermission } = usePermission();
    
    if (!hasAnyPermission(requiredPermissions)) {
      return fallback || <div>アクセス権限がありません</div>;
    }
    
    return <WrappedComponent {...props} />;
  };
};

// 権限チェック用のガードコンポーネント
interface PermissionGuardProps {
  permissions: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissions,
  requireAll = false,
  fallback,
  children,
}) => {
  const { hasAllPermissions, hasAnyPermission } = usePermission();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);
  
  if (!hasAccess) {
    return <>{fallback}</> || null;
  }
  
  return <>{children}</>;
};

// ロールチェック用のガードコンポーネント
interface RoleGuardProps {
  roles: Role[];
  minimumRole?: Role;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  minimumRole,
  fallback,
  children,
}) => {
  const { hasRole, hasMinimumRole } = usePermission();
  
  const hasAccess = minimumRole
    ? hasMinimumRole(minimumRole)
    : roles.some(role => hasRole(role));
  
  if (!hasAccess) {
    return <>{fallback}</> || null;
  }
  
  return <>{children}</>;
};