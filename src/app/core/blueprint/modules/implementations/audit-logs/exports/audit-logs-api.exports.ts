/**
 * Audit Logs Module Exports
 *
 * Public API for the Audit Logs module.
 * Defines what functionality is exposed to other modules.
 *
 * @author GigHub Development Team
 * @date 2025-12-13
 */

// Export models
export * from '../models/audit-log.model';
export * from '../models/audit-log.types';

// Export repository
export { AuditLogRepository, AuditLogPage } from '../repositories/audit-log.repository';

// Export service
export { AuditLogsService } from '../services/audit-logs.service';

// Export component
export { AuditLogsComponent } from '../components/audit-logs.component';

// Export metadata
export {
  AUDIT_LOGS_MODULE_METADATA,
  AUDIT_LOGS_MODULE_DEFAULT_CONFIG,
  AUDIT_LOGS_MODULE_PERMISSIONS,
  AUDIT_LOGS_MODULE_EVENTS
} from '../module.metadata';

// Export config
export { AuditLogsConfig, DEFAULT_AUDIT_LOGS_CONFIG } from '../config/audit-logs.config';

// Export module
export { AuditLogsModule } from '../audit-logs.module';
