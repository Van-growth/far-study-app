// SSOT: Supabase table names and RPC function names
// All DB access in src/lib/db.ts must use these constants — no hardcoded strings

export const DB = {
  TABLES: {
    CONCEPT_EXTRACTIONS: 'concept_extractions',
    ATTEMPT_ERRORS: 'attempt_errors',
    ERROR_PATTERNS: 'error_patterns',
    QUIZ_LOGS: 'quiz_logs',
    TOPIC_PROGRESS: 'topic_progress',
    STUDY_SESSIONS: 'study_sessions',
    CONCEPT_STATS: 'concept_stats',
    MIGRATION_HISTORY: 'migration_history',
    FEEDBACK_LOGS: 'feedback_logs',
    DAILY_REVIEW_LOG: 'daily_review_log',
    BRIEFING_CACHE: 'briefing_cache',
    SRS_CONCEPT_REVIEW: 'srs_concept_review',
    REVIEW_RESULT: 'review_result',
    CONCEPT_FEEDBACK: 'concept_feedback',
    DAILY_REFLECTION: 'daily_reflection',
  },
  RPC: {
    CONCEPT_STATS_INCREMENT: 'concept_stats_increment',
    TAG_ATTEMPT_ERROR: 'tag_attempt_error',
    REFRESH_PATTERN_STATS: 'refresh_pattern_stats',
    EXEC_SQL: 'exec_sql',
  },
} as const
