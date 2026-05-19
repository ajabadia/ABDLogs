const fs = require('fs');
const path = require('path');

const targetPaths = [
  // Obsolete routes and directories
  'src/app/[locale]/exams',
  'src/app/[locale]/quiz',
  'src/app/[locale]/examinar',
  'src/app/[locale]/history',
  'src/app/[locale]/admin/attempts',
  'src/app/[locale]/admin/allegations',
  'src/app/[locale]/admin/corpus',
  'src/app/[locale]/admin/exams',
  'src/app/[locale]/admin/questions',
  'src/components/quiz',
  'src/components/analytics',
  
  // Obsolete, defunct models
  'src/models/Allegation.ts',
  'src/models/CorpusImport.ts',
  'src/models/CorpusImportRow.ts',
  'src/models/ExamAttempt.ts',
  'src/models/ExamConfig.ts',
  'src/models/Question.ts',

  // Obsolete, defunct services
  'src/services/allegations',
  'src/services/corpus',
  'src/services/quiz',

  // Obsolete, defunct server actions
  'src/actions/allegations.ts',
  'src/actions/analytics.ts',
  'src/actions/corpus.ts',
  'src/actions/examConfig.ts',
  'src/actions/question.ts',
  'src/actions/quiz.ts',

  // Obsolete, defunct lib folders
  'src/lib/corpus',
  'src/lib/validation',

  // Obsolete types and hooks
  'src/types/quiz.ts',
  'src/hooks/useQuizTimer.ts',

  // Obsolete, defunct quiz-specific scripts
  'scripts/audit_db.js',
  'scripts/audit_db.ts',
  'scripts/fire_test.ts',
  'scripts/identify_question.ts',
  'scripts/sanitize_db.ts',
  'scripts/seed-questions.mjs'
];

console.log('[Clean Script] Starting comprehensive cleaning of obsolete quiz files...');

targetPaths.forEach((relPath) => {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`[Clean Script] Successfully deleted: ${relPath}`);
    } catch (err) {
      console.error(`[Clean Script] Failed to delete: ${relPath}. Error: ${err.message}`);
    }
  } else {
    console.log(`[Clean Script] Path not found (already clean): ${relPath}`);
  }
});

console.log('[Clean Script] Cleaning complete!');
