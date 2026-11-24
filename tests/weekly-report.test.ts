// Edge case test suite for Weekly Report helpers
import { 
  formatLocalDate, 
  parseLocalDate, 
  getMondayOfWeek, 
  addDays 
} from '../src/features/reports/weekly-report.view';

const runTests = () => {
  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, extra?: any) => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`, extra || '');
      failed++;
    }
  };

  console.log('--- Running Weekly Report Edge Case Tests ---');

  // Scenario 1: Sunday handling (Sunday must roll BACK to Monday of that current week, not next week)
  const sunday = new Date(2026, 10, 29); // 2026-11-29 is a Sunday
  const monFromSun = getMondayOfWeek(sunday);
  assert('Sunday maps to Monday of same week', formatLocalDate(monFromSun) === '2026-11-23');

  // Scenario 2: Monday maps to itself
  const monday = new Date(2026, 10, 23); // 2026-11-23 is Monday
  const monFromMon = getMondayOfWeek(monday);
  assert('Monday maps to itself', formatLocalDate(monFromMon) === '2026-11-23');

  // Scenario 3: Saturday maps to Monday of that week
  const saturday = new Date(2026, 10, 28);
  const monFromSat = getMondayOfWeek(saturday);
  assert('Saturday maps to Monday of same week', formatLocalDate(monFromSat) === '2026-11-23');

  // Scenario 4: Month crossover (e.g. Nov 30 to Dec 6)
  const nov30Mon = new Date(2026, 10, 30);
  const sunInDec = addDays(nov30Mon, 6);
  assert('Month boundary transition computes Dec 6', formatLocalDate(sunInDec) === '2026-12-06');

  // Scenario 5: Year crossover (e.g. Dec 28, 2026 to Jan 3, 2027)
  const endOfYearMon = new Date(2026, 11, 28);
  const nextYearSun = addDays(endOfYearMon, 6);
  assert('Year boundary transition computes Jan 03, 2027', formatLocalDate(nextYearSun) === '2027-01-03');

  // Scenario 6: parseLocalDate invalid format fallback
  const fallback = parseLocalDate('invalid-date');
  assert('Invalid date string does not throw and returns valid Date', !isNaN(fallback.getTime()));

  // Scenario 7: parseLocalDate returns consistent day
  const parsed = parseLocalDate('2026-11-24');
  assert('Parsed date maintains exact year, month and day', formatLocalDate(parsed) === '2026-11-24');

  // Scenario 8: Local date formatting preserves 2-digit padding
  const singleDigitDate = new Date(2026, 0, 5); // Jan 5
  assert('Pads single digits with leading zero', formatLocalDate(singleDigitDate) === '2026-01-05');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
};

runTests();
