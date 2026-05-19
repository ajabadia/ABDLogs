import fs from 'fs';
import path from 'path';

const middlewarePath = path.resolve('src/middleware.ts');

if (fs.existsSync(middlewarePath)) {
  fs.unlinkSync(middlewarePath);
  console.log("🗑️ Successfully deleted deprecated src/middleware.ts!");
} else {
  console.log("ℹ️ Deprecated src/middleware.ts does not exist.");
}
