/**
 * Workspace Context Service (Firebase Version)
 *
 * 統一的工作區上下文管理服務 (Firebase 版本)
 * Unified workspace context management service (Firebase version)
 *
 * Manages the current workspace context (user, organization, team, bot)
 * and provides reactive state for context switching.
 *
 * Integrated with MenuManagementService for dynamic menu updates.
 *
 * @module shared/services
 */

import { Injectable, computed, inject, signal, effect, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContextType, Account, Organization, Team, Bot } from '@core';
import { FirebaseAuthService } from '@core';
import { SettingsService } from '@delon/theme';
import { OrganizationRepository } from './organization/organization.repository';
import { TeamRepository } from './team/team.repository';
import { combineLatest, EMPTY } from 'rxjs';

const STORAGE_KEY = 'workspace_context';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceContextService {
  private readonly firebaseAuth = inject(FirebaseAuthService);
  private readonly organizationRepo = inject(OrganizationRepository);
  private readonly teamRepo = inject(TeamRepository);
  private readonly settingsService = inject(SettingsService);

  // Convert Firebase auth user observable to a reactive signal
  private readonly firebaseUser = toSignal(this.firebaseAuth.user$, { initialValue: null });

  // === 上下文狀態 Context State ===
  private readonly contextTypeState = signal<ContextType>(ContextType.USER);
  private readonly contextIdState = signal<string | null>(null);
  private readonly switchingState = signal<boolean>(false);

  readonly contextType = this.contextTypeState.asReadonly();
  readonly contextId = this.contextIdState.asReadonly();
  readonly switching = this.switchingState.asReadonly();

  // === 資料狀態 Data State ===
  private readonly currentUserState = signal<Account | null>(null);
  private readonly organizationsState = signal<Organization[]>([]);
  private readonly teamsState = signal<Team[]>([]);
  private readonly botsState = signal<Bot[]>([]);
  
  // Loading states
  private readonly loadingOrganizationsState = signal<boolean>(false);
  private readonly loadingTeamsState = signal<boolean>(false);

  readonly currentUser = this.currentUserState.asReadonly();
  readonly organizations = this.organizationsState.asReadonly();
  readonly teams = this.teamsState.asReadonly();
  readonly bots = this.botsState.asReadonly();
  readonly loadingOrganizations = this.loadingOrganizationsState.asReadonly();
  readonly loadingTeams = this.loadingTeamsState.asReadonly();

  // === Computed Signals ===
  readonly contextLabel = computed(() => {
    const type = this.contextType();
    const id = this.contextId();

    switch (type) {
      case ContextType.USER:
        return this.currentUser()?.name || '個人帳戶';
      case ContextType.ORGANIZATION:
        return this.organizations().find(o => o.id === id)?.name || '組織';
      case ContextType.TEAM:
        return this.teams().find(t => t.id === id)?.name || '團隊';
      case ContextType.BOT:
        return this.bots().find(b => b.id === id)?.name || '機器人';
      default:
        return '個人帳戶';
    }
  });

  readonly contextIcon = computed(() => {
    const iconMap = {
      [ContextType.USER]: 'user',
      [ContextType.ORGANIZATION]: 'team',
      [ContextType.TEAM]: 'usergroup-add',
      [ContextType.BOT]: 'robot'
    };
    return iconMap[this.contextType()] || 'user';
  });

  /**
   * Update SettingsService when context changes (single source of truth for avatars/names)
   * This ensures ng-alain components (sidebar, header) automatically update via SettingsService
   * Follows Occam's Razor: one source of truth instead of duplicate computed signals
   */
  private syncSettingsServiceAvatar(): void {
    const type = this.contextType();
    const id = this.contextId();
    let avatarUrl: string | null = null;
    let name = '';

    switch (type) {
      case ContextType.USER:
        avatarUrl = this.currentUser()?.avatar_url || null;
        name = this.currentUser()?.name || 'User';
        break;
      case ContextType.ORGANIZATION:
        const org = this.organizations().find(o => o.id === id);
        avatarUrl = org?.logo_url || null;
        name = org?.name || 'Organization';
        break;
      case ContextType.TEAM:
        const team = this.teams().find(t => t.id === id);
        if (team) {
          const parentOrg = this.organizations().find(o => o.id === team.organization_id);
          avatarUrl = parentOrg?.logo_url || null;
          name = team.name;
        }
        break;
      case ContextType.BOT:
        name = 'Bot';
        break;
    }

    // Update ng-alain SettingsService (single source of truth)
    // All components read from here - no duplicate logic
    this.settingsService.setUser({
      ...this.settingsService.user,
      name,
      avatar: avatarUrl || './assets/tmp/img/avatar.jpg'
    });
  }


  readonly teamsByOrganization = computed(() => {
    const teams = this.teams();
    const orgs = this.organizations();
    const map = new Map<string, Team[]>();

    orgs.forEach(org => map.set(org.id, []));
    teams.forEach(team => {
      const orgId = team.organization_id;
      if (orgId && map.has(orgId)) {
        map.get(orgId)!.push(team);
      }
    });

    return map;
  });

  /** 是否已認證 */
  readonly isAuthenticated = computed(() => {
    return !!this.firebaseUser()?.uid;
  });

  constructor() {
    // 監聽認證狀態並自動載入資料
    // Use effect with allowSignalWrites to handle async operations properly
    effect(() => {
      const user = this.firebaseUser();
      
      if (user) {
        // Convert Firebase user to Account
        const accountData = {
          id: user.uid,
          uid: user.uid,
          name: user.displayName || user.email || 'User',
          email: user.email || '',
          avatar_url: user.photoURL,
          created_at: new Date().toISOString()
        };
        
        this.currentUserState.set(accountData);
        
        // Initialize ng-alain SettingsService user to prevent JSON parse errors
        // This ensures the sidebar user component has data on first load
        this.settingsService.setUser({
          name: accountData.name,
          avatar: accountData.avatar_url || './assets/tmp/img/avatar.jpg',
          email: accountData.email
        });

        // Schedule data loading outside the effect
        // Use untracked to prevent infinite loops
        untracked(() => {
          this.loadUserData(user.uid);
          this.restoreContext();
        });
      } else {
        this.reset();
      }
    }, { allowSignalWrites: true });
  }
  
  /**
   * 載入使用者資料（組織、團隊）
   * Load user data (organizations, teams) from Firebase
   */
  private loadUserData(userId: string): void {
    console.log('[WorkspaceContextService] 📥 Loading user data for:', userId);
    
    // Load organizations created by or accessible to the user
    this.loadingOrganizationsState.set(true);
    this.organizationRepo.findByCreator(userId).subscribe({
      next: (organizations) => {
        console.log('[WorkspaceContextService] ✅ Organizations loaded:', organizations.length);
        this.organizationsState.set(organizations);
        this.loadingOrganizationsState.set(false);
        
        // Load teams for each organization
        if (organizations.length > 0) {
          this.loadTeamsForOrganizations(organizations.map(o => o.id));
        } else {
          this.teamsState.set([]);
        }
      },
      error: (error) => {
        console.error('[WorkspaceContextService] ❌ Failed to load organizations:', error);
        this.loadingOrganizationsState.set(false);
        this.organizationsState.set([]);
      }
    });
  }
  
  /**
   * 載入組織的團隊
   * Load teams for organizations
   */
  private loadTeamsForOrganizations(organizationIds: string[]): void {
    if (organizationIds.length === 0) {
      this.teamsState.set([]);
      return;
    }
    
    console.log('[WorkspaceContextService] 📥 Loading teams for organizations:', organizationIds.length);
    this.loadingTeamsState.set(true);
    
    // Combine teams from all organizations
    const teamObservables = organizationIds.map(orgId => 
      this.teamRepo.findByOrganization(orgId)
    );
    
    combineLatest(teamObservables).subscribe({
      next: (teamArrays) => {
        // Flatten array of arrays into single array
        const allTeams = teamArrays.flat();
        console.log('[WorkspaceContextService] ✅ Teams loaded:', allTeams.length);
        this.teamsState.set(allTeams);
        this.loadingTeamsState.set(false);
      },
      error: (error) => {
        console.error('[WorkspaceContextService] ❌ Failed to load teams:', error);
        this.loadingTeamsState.set(false);
        this.teamsState.set([]);
      }
    });
  }

  // === 上下文切換 Context Switching ===

  switchToUser(userId: string): void {
    this.switchContext(ContextType.USER, userId);
  }

  switchToOrganization(organizationId: string): void {
    this.switchContext(ContextType.ORGANIZATION, organizationId);
  }

  switchToTeam(teamId: string): void {
    this.switchContext(ContextType.TEAM, teamId);
  }

  switchToBot(botId: string): void {
    this.switchContext(ContextType.BOT, botId);
  }

  /**
   * 切換上下文
   * Switch context
   */
  switchContext(type: ContextType, id: string | null): void {
    console.log('[WorkspaceContextService] 🔀 Switching context:', { type, id });
    this.switchingState.set(true);
    this.contextTypeState.set(type);
    this.contextIdState.set(id);
    
    // Sync avatar/name to SettingsService (single source of truth)
    this.syncSettingsServiceAvatar();
    
    this.persistContext();
    this.switchingState.set(false);
    console.log('[WorkspaceContextService] ✅ Context switched successfully');
  }

  // === Organization Management ===

  /**
   * 添加組織
   * Add organization to the list
   */
  addOrganization(org: Organization): void {
    const current = this.organizationsState();
    // 檢查是否已存在，避免重複
    // Check if already exists to avoid duplicates
    if (!current.find(o => o.id === org.id)) {
      this.organizationsState.set([...current, org]);
      console.log('[WorkspaceContextService] Organization added:', org.name);
      
      // Reload teams for the new organization
      this.loadTeamsForOrganizations([org.id]);
    } else {
      console.log('[WorkspaceContextService] Organization already exists:', org.name);
    }
  }

  /**
   * 刪除組織
   * Remove organization from the list
   */
  removeOrganization(orgId: string): void {
    const current = this.organizationsState();
    this.organizationsState.set(current.filter(o => o.id !== orgId));
    
    // Remove teams for this organization
    const currentTeams = this.teamsState();
    this.teamsState.set(currentTeams.filter(t => t.organization_id !== orgId));
    
    console.log('[WorkspaceContextService] Organization removed:', orgId);
  }
  
  /**
   * 重新載入資料
   * Reload data from Firebase
   */
  reloadData(): void {
    const user = this.firebaseUser();
    if (user) {
      console.log('[WorkspaceContextService] 🔄 Reloading data...');
      this.loadUserData(user.uid);
    }
  }

  // === Team Management ===

  /**
   * 添加團隊
   * Add team to the list
   */
  addTeam(team: Team): void {
    const current = this.teamsState();
    // 檢查是否已存在，避免重複
    // Check if already exists to avoid duplicates
    if (!current.find(t => t.id === team.id)) {
      this.teamsState.set([...current, team]);
      console.log('[WorkspaceContextService] Team added:', team.name);
    } else {
      console.log('[WorkspaceContextService] Team already exists:', team.name);
    }
  }

  /**
   * 刪除團隊
   * Remove team from the list
   */
  removeTeam(teamId: string): void {
    const current = this.teamsState();
    this.teamsState.set(current.filter(t => t.id !== teamId));
    console.log('[WorkspaceContextService] Team removed:', teamId);
  }

  // === 持久化 Persistence ===

  /**
   * 恢復上下文（從 localStorage）
   * Restore context from localStorage
   */
  restoreContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('[WorkspaceContextService] 💾 Saved context:', saved);

      if (saved) {
        const { type, id } = JSON.parse(saved);
        this.contextTypeState.set(type);
        this.contextIdState.set(id);
        console.log('[WorkspaceContextService] ✅ Context restored:', { type, id });
      } else {
        // Default to user context
        const userId = this.currentUser()?.id;
        if (userId) {
          this.switchToUser(userId);
        }
      }
    } catch (error) {
      console.error('[WorkspaceContextService] ❌ Failed to restore context:', error);
    }
  }

  /**
   * 儲存上下文（到 localStorage）
   * Persist context to localStorage
   */
  private persistContext(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const state = {
        type: this.contextType(),
        id: this.contextId()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[WorkspaceContextService] 💾 Context persisted:', state);
    } catch (error) {
      console.error('[WorkspaceContextService] ❌ Failed to persist context:', error);
    }
  }

  /**
   * 重置狀態
   * Reset state
   */
  private reset(): void {
    this.currentUserState.set(null);
    this.organizationsState.set([]);
    this.teamsState.set([]);
    this.botsState.set([]);
    this.contextTypeState.set(ContextType.USER);
    this.contextIdState.set(null);
    console.log('[WorkspaceContextService] 🔄 State reset');
  }

  /**
   * Get teams for a specific organization
   */
  getTeamsForOrg(orgId: string): Team[] {
    return this.teamsByOrganization().get(orgId) || [];
  }
}
