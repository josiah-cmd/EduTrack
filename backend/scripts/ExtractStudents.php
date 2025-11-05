<?php
require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpWord\IOFactory;
use League\Csv\Writer;

$output = __DIR__ . '/../storage/app/students.csv';

// 🧹 Delete old CSV if it exists to prevent duplicates or appends
if (file_exists($output)) {
    unlink($output);
    echo "🧹 Removed old students.csv\n";
}

$csv = Writer::createFromPath($output, 'w+');
$csv->insertOne(['name', 'email', 'grade_level', 'section', 'lrn']);

$totalStudents = 0;

// 🧩 Track all used emails and LRNs globally
$usedEmails = [];
$usedLrns = [];

$sources = [
    ['file' => 'GRADE 7 (CLASS LIST WITH LRN).docx',  'grade' => '7',  'section' => 'Grade 7 - Our Lady of Lourdes'],
    ['file' => 'GRADE 8 - ST. JOSEPH CALASANZ OFFICIAL CLASS LIST.docx', 'grade' => '8',  'section' => 'Grade 8 - St. Joseph of Calasanz'],
    ['file' => 'Grade 9 Official Class List A.Y. 2025-2026.docx', 'grade' => '9', 'section' => 'Grade 9 - St. Peter Damian'],
    ['file' => 'GRADE 10_CLASS LIST - LRN.docx', 'grade' => '10', 'section' => 'Grade 10 - St. Gregory the Great'],
    ['file' => 'Grade 11Class-List-2025-2026 updated.docx', 'grade' => '11', 'section' => 'Grade 11 - St. Josef Freinademetz (ABM)'],
    ['file' => 'GRADE 12 OFFICIAL LIST 25-26.docx', 'grade' => '12', 'section' => 'Grade 12 - St. Dominic De Guzman (ABM)'],
];

foreach ($sources as $src) {
    $path = __DIR__ . "/../storage/app/{$src['file']}";

    if (!file_exists($path)) {
        echo "⚠️  File not found: {$path}\n";
        continue;
    }

    $word = IOFactory::load($path);
    $text = '';

    // 🧩 Extract all text from tables and paragraphs
    foreach ($word->getSections() as $section) {
        foreach ($section->getElements() as $element) {
            if (method_exists($element, 'getRows')) {
                foreach ($element->getRows() as $row) {
                    foreach ($row->getCells() as $cell) {
                        foreach ($cell->getElements() as $el) {
                            if (method_exists($el, 'getText')) {
                                $text .= $el->getText() . "\n";
                            }
                        }
                    }
                }
            } elseif (method_exists($element, 'getText')) {
                $text .= $element->getText() . "\n";
            }
        }
    }

    $lines = array_filter(array_map('trim', explode("\n", $text)));
    $currentLrn = null;

    foreach ($lines as $line) {
        // ✅ Detect LRN (10–12 digits)
        if (preg_match('/^\d{10,12}$/', $line)) {
            $currentLrn = $line;
            continue;
        }

        // ✅ Detect names (alphabetic content)
        if ($currentLrn && preg_match('/[A-Za-z]/', $line)) {
            // 🚫 Skip if LRN already processed (duplicate student)
            if (isset($usedLrns[$currentLrn])) {
                $currentLrn = null;
                continue;
            }

            // 🧼 Clean name formatting
            $name = ucwords(strtolower(trim(preg_replace('/^[0-9\.\-\s]+/', '', $line))));
            $name = preg_replace('/\s+/', ' ', $name); // normalize spacing
            $name = str_replace([' ,', ', '], ', ', $name); // fix comma spacing

            // 🧠 Handle "Last, First" format (common in lists)
            if (strpos($name, ',') !== false) {
                $parts = array_map('trim', explode(',', $name));
                if (count($parts) >= 2) {
                    $lastName = $parts[0];
                    $firstName = preg_split('/\s+/', $parts[1])[0] ?? '';
                } else {
                    $lastName = $parts[0];
                    $firstName = '';
                }
                $properName = ucwords(strtolower(trim($parts[1] . ' ' . $parts[0])));
            } else {
                $properName = ucwords(strtolower($name));
                $split = preg_split('/\s+/', $properName);
                $firstName = $split[0] ?? '';
                $lastName = end($split) ?? '';
            }

            // 🔒 Build safe, readable email
            $first = strtolower(preg_replace('/[^a-z]/', '', $firstName));
            $last  = strtolower(preg_replace('/[^a-z]/', '', $lastName));

            // Handle cases with missing first or last
            if (!$first && $last) {
                $first = 'student';
            } elseif ($first && !$last) {
                $last = 'user';
            } elseif (!$first && !$last) {
                $first = 'unknown';
                $last = 'student';
            }

            $baseEmail = $first . '.' . $last . '@edutrack.com';
            $email = $baseEmail;

            // ✅ Prevent duplicate emails globally
            $counter = 1;
            while (isset($usedEmails[$email])) {
                $counter++;
                $email = $first . '.' . $last . $counter . '@edutrack.com';
            }

            // 🧠 Mark both email and LRN as used
            $usedEmails[$email] = true;
            $usedLrns[$currentLrn] = true;

            $csv->insertOne([$properName, $email, $src['grade'], $src['section'], $currentLrn]);
            $currentLrn = null;
            $totalStudents++;
        }
    }
}

echo "✅ students.csv created at storage/app/students.csv\n";
echo "📊 Total students extracted: {$totalStudents}\n";