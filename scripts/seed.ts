import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local before anything else
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  addDays,
  addWeeks,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import * as schema from "../lib/db/schema";

const {
  schools,
  users,
  students,
  studentParents,
  studentBudgets,
  vendorCategories,
  vendorCatalog,
  purchaseRequests,
  purchaseOrders,
  studentProgressNotes,
  engagementLogs,
  newsletters,
  contactLogs,
} = schema;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// ─── Helper Utilities ─────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// ─── Student Data ─────────────────────────────────────────────────────────────

const STUDENT_FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Elijah", "Sophia", "James",
  "Isabella", "Oliver", "Mia", "William", "Charlotte", "Benjamin", "Amelia",
  "Lucas", "Harper", "Henry", "Evelyn", "Alexander", "Luna", "Mason",
  "Camila", "Ethan", "Penelope",
];

const STUDENT_LAST_NAMES = [
  "Thompson", "Garcia", "Martinez", "Rodriguez", "Williams", "Johnson",
  "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson",
  "Thomas", "Jackson", "White", "Harris", "Martin", "Lee", "Perez",
  "Walker", "Hall", "Young", "Allen", "Sanchez",
];

// Assign specific grades (mix of K-12)
const STUDENT_GRADES = [
  0, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12,
  2, 6, 9,
];

// ─── Parent Data ──────────────────────────────────────────────────────────────

const PARENT_FIRST_NAMES = [
  "Jennifer", "Michael", "Patricia", "Robert", "Linda", "David", "Barbara",
  "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles",
  "Karen", "Christopher", "Lisa", "Daniel", "Nancy", "Matthew", "Betty",
  "Anthony", "Margaret", "Mark", "Sandra",
];

const PARENT_LAST_NAMES = [
  "Thompson", "Garcia", "Martinez", "Rodriguez", "Williams", "Johnson",
  "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson",
  "Thomas", "Jackson", "White", "Harris", "Martin", "Lee", "Perez",
  "Walker", "Hall", "Young", "Allen", "Sanchez",
];

// ─── Activity Types ───────────────────────────────────────────────────────────

const ACTIVITY_TYPES = [
  "Reading",
  "Math Practice",
  "Writing",
  "Science Experiment",
  "History Study",
  "Art Project",
  "Music Practice",
  "Physical Education",
  "Online Course",
  "Educational Video",
  "Nature Study",
  "Coding",
  "Foreign Language",
  "Logic Puzzles",
  "Library Visit",
  "Field Trip",
  "Educational Game",
  "Research Project",
];

const ACTIVITY_DESCRIPTIONS: Record<string, string[]> = {
  Reading: [
    "Read chapters 3-5 of assigned novel with excellent comprehension.",
    "Completed 30 minutes of independent reading, discussed main themes.",
    "Worked through two reading comprehension worksheets.",
    "Read aloud practice focusing on fluency and expression.",
  ],
  "Math Practice": [
    "Completed Saxon Math lesson 42 — long division with remainders.",
    "Worked through Khan Academy exercises on fractions.",
    "Practiced multiplication tables 6-9 with 95% accuracy.",
    "Solved real-world word problems involving decimals.",
  ],
  Writing: [
    "Drafted a 3-paragraph essay on favorite animal.",
    "Completed IEW writing lesson on key word outlines.",
    "Practiced cursive handwriting — lowercase letters.",
    "Worked on descriptive writing using sensory details.",
  ],
  "Science Experiment": [
    "Completed Apologia Zoology lapbook on bird adaptations.",
    "Conducted a baking soda and vinegar volcano experiment.",
    "Observed and recorded plant growth over the week.",
    "Mystery Science lesson on states of matter.",
  ],
  "History Study": [
    "Read Story of the World chapter on Ancient Egypt.",
    "Completed timeline activity for early American history.",
    "Watched Drive Thru History episode and wrote summary.",
    "Map work identifying states and capitals.",
  ],
  "Art Project": [
    "Worked on watercolor painting technique from art class.",
    "Completed sketching exercises from Drawing on the Right Side.",
    "Created a mixed media collage for art portfolio.",
    "Practiced perspective drawing with one-point perspective.",
  ],
  "Music Practice": [
    "30 minutes piano practice — scales and current piece.",
    "Recorder practice: Hot Cross Buns and Mary Had a Little Lamb.",
    "Rhythm exercises with metronome.",
    "Learned to read basic music notation.",
  ],
  "Physical Education": [
    "Soccer practice — 90 minutes, drills and scrimmage.",
    "YMCA swim lesson and 20 minutes free swim.",
    "Outdoor bike ride 3 miles along the trail.",
    "Tennis lesson focusing on backhand technique.",
  ],
  "Online Course": [
    "Completed two Outschool coding lessons.",
    "Watched and took notes on CTY online lecture.",
    "Worked through Khan Academy science unit.",
    "Completed Coursera module quiz with 90% score.",
  ],
  "Educational Video": [
    "Watched two Khan Academy videos on photosynthesis.",
    "National Geographic documentary on ocean habitats.",
    "Crash Course history episode with note-taking.",
    "Math Antics video on long division.",
  ],
  "Nature Study": [
    "Nature walk — identified 5 local bird species.",
    "Pressed and labeled wildflower specimens.",
    "Tide pool observation at Dana Point Harbor.",
    "Sky and cloud journaling — weather patterns.",
  ],
  Coding: [
    "Worked through Scratch coding project — interactive story.",
    "Python basics: variables and simple functions.",
    "Completed Hour of Code activity on algorithms.",
    "Built a simple HTML webpage.",
  ],
  "Foreign Language": [
    "Spanish tutor session — 45 minutes on present tense verbs.",
    "Duolingo Spanish — completed 3 lessons.",
    "Watched Spanish children's show for immersion.",
    "Practiced Spanish conversation with tutor.",
  ],
  "Logic Puzzles": [
    "Completed Building Thinking Skills workbook pages 12-15.",
    "Chess club — practiced opening theory.",
    "Critical thinking worksheet from Critical Thinking Co.",
    "Sudoku and logic grid puzzles.",
  ],
  "Library Visit": [
    "Library visit — checked out 4 books, read for 45 min.",
    "Library STEM program — robotics introduction.",
    "Research session for history project.",
    "Author reading event at local library.",
  ],
  "Field Trip": [
    "San Diego Natural History Museum — dinosaur exhibit.",
    "Mission San Juan Capistrano historical tour.",
    "Irvine Spectrum science center.",
    "Farmers market — math practice with money.",
  ],
  "Educational Game": [
    "Prodigy Math — completed 3 quests, earned 250 points.",
    "Blooket review game for upcoming science quiz.",
    "Timeline board game — American history.",
    "Multiplication War card game — 20 minutes.",
  ],
  "Research Project": [
    "Began research on chosen science fair topic.",
    "Gathered sources for country report on Japan.",
    "Created bibliography for research project.",
    "Outlined 5-paragraph research essay.",
  ],
};

// ─── Progress Note Templates ──────────────────────────────────────────────────

const PROGRESS_NOTE_TEMPLATES = [
  {
    aiDrafted: true,
    content: (name: string, grade: string) =>
      `${name} has demonstrated strong progress this month in all core subject areas. In mathematics, ${name} has consistently completed ${grade}-level work with accuracy rates above 90%, showing particular strength in problem-solving strategies. Reading comprehension has improved notably, with ${name} now reading two grade levels above expectations. Writing remains an area of continued growth — we are focusing on paragraph organization and expanding vocabulary. Overall, ${name} is an engaged and motivated learner who takes initiative in their independent studies. Parent communication has been excellent, and the family is actively supporting the educational plan at home.`,
  },
  {
    aiDrafted: true,
    content: (name: string, _grade: string) =>
      `This monthly progress report highlights ${name}'s continued commitment to their personalized learning program. Science has been a particular standout this period — ${name} completed all scheduled experiments and demonstrated excellent scientific reasoning skills. History studies are on track with the curriculum timeline. One area of focus for the coming month will be increasing writing output and practicing revision strategies. ${name} participates enthusiastically during our weekly check-in meetings and asks thoughtful questions that show deep engagement with the material. Recommended next steps: continue current math curriculum and introduce more challenging reading selections.`,
  },
  {
    aiDrafted: false,
    content: (name: string, _grade: string) =>
      `Great month for ${name}! We had a wonderful check-in meeting on the 15th where ${name} showed me their science lapbook — truly impressive work. The level of detail and creativity was beyond what I expected. Math is going well; we are sticking with the Saxon curriculum and ${name} is making steady progress. I do want to note that we should increase the frequency of writing assignments — perhaps one additional essay per month. Parent has been very communicative and sends weekly activity logs promptly. No concerns at this time. Looking forward to seeing ${name}'s science fair project come together next month.`,
  },
  {
    aiDrafted: false,
    content: (name: string, _grade: string) =>
      `Monthly check-in notes for ${name}: Overall doing well. Math curriculum is progressing on schedule. Reading logs show consistent daily reading habits, which is great to see. Had a phone call with parent this week — they mentioned ${name} has been especially interested in astronomy lately and asked about adding some enrichment in that area. I recommended the Generation Genius astronomy unit as a supplement. Writing sample reviewed — showing improvement in sentence variety. Engagement logs submitted on time and reflect a healthy variety of learning activities. Will follow up next month on the astronomy enrichment and writing progress.`,
  },
  {
    aiDrafted: true,
    content: (name: string, grade: string) =>
      `End-of-semester progress summary for ${name} (Grade ${grade}): This has been a productive semester of independent study. Key accomplishments include completing the first half of the math curriculum ahead of schedule, reading 8 books independently, and submitting all required work samples on time. ${name} has shown growth in self-directed learning skills, which is a core goal of our independent study program. Areas for second-semester focus: deepen writing skills with longer-form assignments, increase science lab frequency, and begin preparation for standardized assessments if applicable. Overall assessment: Satisfactory progress. Parent partnership has been outstanding throughout the semester.`,
  },
];

// ─── Newsletter Templates ─────────────────────────────────────────────────────

const NEWSLETTER_1 = {
  title: "October Monthly Newsletter — Coastal Connections Academy",
  subjectLine: "CCA October Newsletter: Fall Learning Updates & Reminders",
  htmlContent: `
<h1>Coastal Connections Academy — October 2024 Newsletter</h1>
<p>Dear CCA Families,</p>
<p>Welcome to our October newsletter! We hope everyone is settling into a wonderful fall learning rhythm. The leaves may not change colors here in Southern California, but we can still feel the excitement of a new season of learning!</p>
<h2>Important Reminders</h2>
<ul>
  <li><strong>Monthly Work Samples Due:</strong> Please submit your October work samples by October 31st. Remember to include samples from at least 3 subject areas.</li>
  <li><strong>Engagement Logs:</strong> Keep logging your daily learning activities. Consistent engagement logs are essential for our school's compliance reporting.</li>
  <li><strong>Budget Reminder:</strong> If you haven't placed your curriculum orders yet, please do so by November 15th to ensure delivery before the holiday break.</li>
</ul>
<h2>Curriculum Spotlight: Math</h2>
<p>We have a wonderful selection of math curricula available in our vendor catalog. Whether your student thrives with Saxon Math's incremental approach or prefers the visual methods in RightStart Math, we have options for every learner. Contact your teacher to discuss the best fit.</p>
<h2>Upcoming Events</h2>
<ul>
  <li><strong>November 1:</strong> Fall Family Gathering (virtual) — 6:00 PM</li>
  <li><strong>November 15:</strong> Curriculum order deadline for holiday delivery</li>
  <li><strong>November 27-29:</strong> School closed — Thanksgiving break</li>
</ul>
<p>As always, we are here to support your family's educational journey. Please don't hesitate to reach out!</p>
<p>Warm regards,<br>Sarah Martinez<br>Lead Teacher, Coastal Connections Academy</p>
  `.trim(),
};

const NEWSLETTER_2 = {
  title: "November Monthly Newsletter — Coastal Connections Academy",
  subjectLine: "CCA November Newsletter: Semester Check-In & Holiday Plans",
  htmlContent: `
<h1>Coastal Connections Academy — November 2024 Newsletter</h1>
<p>Dear CCA Families,</p>
<p>November is here and we are officially in the second quarter of our school year! It is wonderful to see the progress our students are making. Here are some updates and important information for the month ahead.</p>
<h2>Mid-Year Check-In Meetings</h2>
<p>We will be scheduling 15-minute virtual check-in meetings with all families this month. These are a great opportunity to review your student's progress, discuss any curriculum adjustments, and plan for the second half of the year. Watch for a scheduling link in your email.</p>
<h2>Student Spotlight</h2>
<p>We want to celebrate the incredible diversity of learning happening in our community! From tide pool explorations in Dana Point to piano recitals, robotics projects, and science fair preparations — our students are doing amazing things. Keep sharing your learning adventures!</p>
<h2>Holiday Break Plans</h2>
<p>Our school will be closed from December 23, 2024 through January 6, 2025 for the winter holiday break. We encourage families to continue relaxed, interest-led learning during this time — reading, cooking math, and nature walks all count!</p>
<h2>Budget Reminder</h2>
<p>Second-semester budget allocations will be reviewed in January. If you have unspent funds from the first semester, please work with your teacher to plan how to use them before June. Purchase requests must be submitted no later than May 1, 2025.</p>
<p>Thank you for being such wonderful partners in education!</p>
<p>With gratitude,<br>Sarah Martinez<br>Lead Teacher, Coastal Connections Academy</p>
  `.trim(),
};

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed...\n");

  // ── 1. Clear tables in reverse dependency order ──────────────────────────
  console.log("🗑️  Clearing existing data...");
  await db.delete(schema.contactLogs);
  await db.delete(schema.aiCoachConversations);
  await db.delete(schema.newsletters);
  await db.delete(schema.engagementLogs);
  await db.delete(schema.studentProgressNotes);
  await db.delete(schema.purchaseOrders);
  await db.delete(schema.purchaseRequests);
  await db.delete(schema.vendorCatalog);
  await db.delete(schema.vendorCategories);
  await db.delete(schema.studentBudgets);
  await db.delete(schema.studentParents);
  await db.delete(schema.students);
  await db.delete(schema.users);
  await db.delete(schema.schools);
  console.log("   Done.\n");

  // ── 2. Create school ──────────────────────────────────────────────────────
  console.log("🏫 Creating school...");
  const [school] = await db
    .insert(schools)
    .values({
      name: "Coastal Connections Academy",
      county: "Orange",
      charterNumber: "CCA-2024",
      schoolYear: "2024-2025",
    })
    .returning();
  console.log(`   Created school: ${school.name} (id: ${school.id})\n`);

  // ── 3. Create staff users ─────────────────────────────────────────────────
  console.log("👩‍🏫 Creating staff users...");
  const [teacher] = await db
    .insert(users)
    .values({
      id: "teacher-uid-placeholder",
      email: "teacher@coastalconnections.edu",
      displayName: "Sarah Martinez",
      role: "teacher",
      schoolId: school.id,
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      id: "admin-uid-placeholder",
      email: "admin@coastalconnections.edu",
      displayName: "David Chen",
      role: "admin",
      schoolId: school.id,
    })
    .returning();

  console.log(`   Created teacher: ${teacher.displayName}`);
  console.log(`   Created admin: ${admin.displayName}\n`);

  // ── 4. Create 25 students + 25 parent users ───────────────────────────────
  console.log("👨‍👩‍👧 Creating 25 students and 25 parent accounts...");

  const createdStudents: (typeof students.$inferSelect)[] = [];
  const createdParents: (typeof users.$inferSelect)[] = [];

  for (let i = 0; i < 25; i++) {
    const firstName = STUDENT_FIRST_NAMES[i];
    const lastName = STUDENT_LAST_NAMES[i];
    const grade = STUDENT_GRADES[i];
    const enrollmentDate = new Date("2024-08-26");

    const [student] = await db
      .insert(students)
      .values({
        firstName,
        lastName,
        grade,
        schoolId: school.id,
        teacherId: teacher.id,
        enrollmentDate: formatDate(enrollmentDate),
        isActive: true,
      })
      .returning();

    createdStudents.push(student);

    // Create parent
    const parentFirstName = PARENT_FIRST_NAMES[i];
    const parentLastName = PARENT_LAST_NAMES[i];
    const parentEmail = `${parentFirstName.toLowerCase()}.${parentLastName.toLowerCase()}@gmail.com`;

    const [parent] = await db
      .insert(users)
      .values({
        id: `parent-uid-${i + 1}`,
        email: parentEmail,
        displayName: `${parentFirstName} ${parentLastName}`,
        role: "parent",
        schoolId: school.id,
      })
      .returning();

    createdParents.push(parent);

    // Link parent to student
    await db.insert(studentParents).values({
      studentId: student.id,
      userId: parent.id,
    });

    const gradeLabel = grade === 0 ? "K" : `${grade}`;
    console.log(
      `   [${i + 1}/25] ${firstName} ${lastName} (Grade ${gradeLabel}) — Parent: ${parentFirstName} ${parentLastName}`
    );
  }
  console.log();

  // ── 5. Create student budgets ─────────────────────────────────────────────
  console.log("💰 Creating student budgets...");
  const spentAmounts = [
    "125.00", "450.00", "320.50", "0.00", "750.00",
    "215.75", "89.99", "1200.00", "630.25", "410.00",
    "875.50", "55.00", "990.75", "1450.00", "175.25",
    "340.00", "620.50", "830.00", "495.75", "1100.00",
    "265.00", "715.25", "380.50", "940.00", "150.75",
  ];

  for (let i = 0; i < createdStudents.length; i++) {
    await db.insert(studentBudgets).values({
      studentId: createdStudents[i].id,
      schoolYear: "2024-2025",
      totalAmount: "2000.00",
      spentAmount: spentAmounts[i],
      notes:
        i % 5 === 0
          ? "Allocated from state independent study funding. Use by May 1, 2025."
          : null,
    });
  }
  console.log(`   Created ${createdStudents.length} budgets at $2,000 each.\n`);

  // ── 6. Create vendor categories ───────────────────────────────────────────
  console.log("📂 Creating vendor categories...");
  const categoryData = [
    { name: "Math", description: "Mathematics curriculum, workbooks, and software" },
    { name: "Language Arts", description: "Reading, writing, spelling, and grammar resources" },
    { name: "Science", description: "Science curriculum, kits, and online programs" },
    { name: "History", description: "History and social studies curriculum" },
    { name: "Electives", description: "Logic, critical thinking, and specialty subjects" },
    { name: "PE & Sports", description: "Physical education and sports registrations" },
    { name: "Art & Music", description: "Art supplies, music lessons, and creative courses" },
    { name: "Tutoring", description: "One-on-one tutoring sessions" },
    { name: "Online Courses", description: "Online classes and digital learning platforms" },
    { name: "Enrichment Activities", description: "Clubs, camps, and enrichment programs" },
  ];

  const createdCategories: (typeof vendorCategories.$inferSelect)[] = [];
  for (const cat of categoryData) {
    const [category] = await db
      .insert(vendorCategories)
      .values({ ...cat, schoolId: school.id })
      .returning();
    createdCategories.push(category);
    console.log(`   Created category: ${category.name}`);
  }
  console.log();

  // Map category names to IDs
  const catMap = Object.fromEntries(
    createdCategories.map((c) => [c.name, c.id])
  );

  // ── 7. Create 50 vendor catalog items ─────────────────────────────────────
  console.log("🛒 Creating vendor catalog items (50 items)...");

  const catalogItems = [
    // Math (5 items)
    {
      vendorName: "Saxon Publishers",
      vendorUrl: "https://www.saxonpublishers.com",
      categoryId: catMap["Math"],
      itemName: "Saxon Math 5/4",
      description: "Comprehensive 4th/5th grade math curriculum with incremental lessons and continuous review. Includes student workbook, tests, and solutions manual.",
      price: "89.00",
      gradeLevels: ["4", "5"],
    },
    {
      vendorName: "Teaching Textbooks",
      vendorUrl: "https://www.teachingtextbooks.com",
      categoryId: catMap["Math"],
      itemName: "Teaching Textbooks 5",
      description: "Self-teaching digital math curriculum for 5th grade. Includes automated grading and step-by-step audio/visual explanations for every problem.",
      price: "124.00",
      gradeLevels: ["5"],
    },
    {
      vendorName: "Khan Academy",
      vendorUrl: "https://www.khanacademy.org",
      categoryId: catMap["Math"],
      itemName: "Khan Academy Plus Annual",
      description: "Annual subscription to Khan Academy's ad-free learning experience with offline downloads and progress reports.",
      price: "144.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Prodigy Education",
      vendorUrl: "https://www.prodigygame.com",
      categoryId: catMap["Math"],
      itemName: "Prodigy Math Membership",
      description: "Annual premium membership for Prodigy Math game. Adaptive math practice in an engaging RPG game format for grades 1-8.",
      price: "59.00",
      gradeLevels: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
    {
      vendorName: "Activities for Learning",
      vendorUrl: "https://www.activitiesforlearning.com",
      categoryId: catMap["Math"],
      itemName: "RightStart Math Level C",
      description: "Hands-on math curriculum for 3rd grade using the AL Abacus and visual teaching methods. Includes lessons, worksheets, and manipulatives.",
      price: "189.00",
      gradeLevels: ["2", "3"],
    },
    // Language Arts (5 items)
    {
      vendorName: "All About Learning Press",
      vendorUrl: "https://www.allaboutlearningpress.com",
      categoryId: catMap["Language Arts"],
      itemName: "All About Reading Level 3",
      description: "Structured literacy reading program for students who have completed levels 1 and 2. Includes teacher's manual, student book, and activity book.",
      price: "95.00",
      gradeLevels: ["2", "3", "4"],
    },
    {
      vendorName: "Institute for Excellence in Writing",
      vendorUrl: "https://iew.com",
      categoryId: catMap["Language Arts"],
      itemName: "IEW Student Writing Intensive",
      description: "Comprehensive writing curriculum DVD/streaming course plus student workbook. Teaches structured approach to writing through note-making and outlining.",
      price: "149.00",
      gradeLevels: ["4", "5", "6", "7", "8"],
    },
    {
      vendorName: "Demme Learning",
      vendorUrl: "https://spellingyousee.com",
      categoryId: catMap["Language Arts"],
      itemName: "Spelling You See Level D",
      description: "Sight-based spelling curriculum that eliminates memorization through chunking and marking patterns. Includes instructor handbook and student pack.",
      price: "45.00",
      gradeLevels: ["2", "3", "4"],
    },
    {
      vendorName: "Peace Hill Press",
      vendorUrl: "https://www.peacehillpress.com",
      categoryId: catMap["Language Arts"],
      itemName: "Writing With Ease Level 2",
      description: "Gentle writing curriculum that builds composition skills through narration, copywork, and dictation. 36-week complete course.",
      price: "39.00",
      gradeLevels: ["2", "3"],
    },
    {
      vendorName: "Educators Publishing Service",
      vendorUrl: "https://eps.schoolspecialty.com",
      categoryId: catMap["Language Arts"],
      itemName: "Explode The Code Book 3",
      description: "Phonics workbook focusing on consonant blends, digraphs, and short vowel patterns through structured exercises and engaging illustrations.",
      price: "14.99",
      gradeLevels: ["1", "2"],
    },
    // Science (5 items)
    {
      vendorName: "Apologia Educational Ministries",
      vendorUrl: "https://www.apologia.com",
      categoryId: catMap["Science"],
      itemName: "Apologia Elementary Zoology",
      description: "Exploring Creation with Zoology series — comprehensive study of animals through a narrative approach with experiments and notebooking journal.",
      price: "75.00",
      gradeLevels: ["1", "2", "3", "4", "5", "6"],
    },
    {
      vendorName: "Mystery Science",
      vendorUrl: "https://www.mysteryscience.com",
      categoryId: catMap["Science"],
      itemName: "Mystery Science Annual",
      description: "Annual subscription to award-winning online science lessons. Includes videos, hands-on activities, and teacher guides aligned to NGSS.",
      price: "99.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5"],
    },
    {
      vendorName: "Generation Genius",
      vendorUrl: "https://www.generationgenius.com",
      categoryId: catMap["Science"],
      itemName: "Generation Genius Annual",
      description: "Science and math video curriculum with professionally produced videos, reading material, quizzes, and hands-on activities.",
      price: "120.00",
      gradeLevels: ["3", "4", "5", "6", "7", "8"],
    },
    {
      vendorName: "Pandia Press",
      vendorUrl: "https://www.pandiapress.com",
      categoryId: catMap["Science"],
      itemName: "R.E.A.L. Science Odyssey",
      description: "Hands-on science curriculum with easy-to-follow lesson plans, experiments, and narration activities. Available for life, earth, chemistry, and physics.",
      price: "65.00",
      gradeLevels: ["0", "1", "2", "3", "4"],
    },
    {
      vendorName: "Demme Learning",
      vendorUrl: "https://jlpublishing.com",
      categoryId: catMap["Science"],
      itemName: "Science in the Beginning",
      description: "Creation-based science curriculum covering all major scientific disciplines with over 100 experiments organized by creation day themes.",
      price: "75.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6"],
    },
    // History (5 items)
    {
      vendorName: "Peace Hill Press",
      vendorUrl: "https://www.peacehillpress.com",
      categoryId: catMap["History"],
      itemName: "Story of the World Vol 1",
      description: "Ancient Times: From the Earliest Nomads to the Last Roman Emperor. Narrative history for young students with activity book available separately.",
      price: "19.00",
      gradeLevels: ["1", "2", "3", "4"],
    },
    {
      vendorName: "Peace Hill Press",
      vendorUrl: "https://www.peacehillpress.com",
      categoryId: catMap["History"],
      itemName: "Story of the World Vol 2",
      description: "The Middle Ages: From the Fall of Rome to the Rise of the Renaissance. Continues the narrative history series.",
      price: "19.00",
      gradeLevels: ["2", "3", "4", "5"],
    },
    {
      vendorName: "Drive Thru History",
      vendorUrl: "https://www.drivethruhistory.com",
      categoryId: catMap["History"],
      itemName: "Drive Thru History Series",
      description: "Annual streaming access to the complete Drive Thru History video series covering ancient world, America, and the Holy Land.",
      price: "45.00",
      gradeLevels: ["4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Beautiful Feet Books",
      vendorUrl: "https://www.bfbooks.com",
      categoryId: catMap["History"],
      itemName: "Beautiful Feet Early American History",
      description: "Literature-based early American history curriculum using primary sources, historical fiction, and biographies. Includes study guide.",
      price: "89.00",
      gradeLevels: ["4", "5", "6", "7", "8"],
    },
    {
      vendorName: "Notgrass History",
      vendorUrl: "https://www.notgrass.com",
      categoryId: catMap["History"],
      itemName: "Notgrass America the Beautiful",
      description: "Comprehensive American history curriculum for middle school combining narrative lessons, primary sources, and literature. One credit of American history.",
      price: "125.00",
      gradeLevels: ["5", "6", "7", "8"],
    },
    // Electives (3 items)
    {
      vendorName: "Logic of English",
      vendorUrl: "https://www.logicofenglish.com",
      categoryId: catMap["Electives"],
      itemName: "Logic of English",
      description: "Advanced phonics and spelling rules curriculum that teaches the logic behind English spelling patterns for older students who struggle with reading/spelling.",
      price: "145.00",
      gradeLevels: ["3", "4", "5", "6", "7"],
    },
    {
      vendorName: "The Critical Thinking Co.",
      vendorUrl: "https://www.criticalthinking.com",
      categoryId: catMap["Electives"],
      itemName: "Building Thinking Skills Level 2",
      description: "Figural and verbal reasoning workbook that develops critical thinking, logic, reading, writing, math, and science skills for grades 4-6.",
      price: "35.00",
      gradeLevels: ["4", "5", "6"],
    },
    {
      vendorName: "The Critical Thinking Co.",
      vendorUrl: "https://www.criticalthinking.com",
      categoryId: catMap["Electives"],
      itemName: "Philosophy for Kids",
      description: "Introduction to philosophy for middle schoolers covering ethics, epistemology, and metaphysics through engaging Socratic discussions and activities.",
      price: "22.00",
      gradeLevels: ["6", "7", "8"],
    },
    // PE & Sports (4 items)
    {
      vendorName: "YMCA of Orange County",
      vendorUrl: "https://www.ymcaoc.org",
      categoryId: catMap["PE & Sports"],
      itemName: "YMCA Youth Sports Registration",
      description: "Registration for YMCA youth sports programs including basketball, soccer, volleyball, and flag football. Seasonal registration.",
      price: "180.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
    },
    {
      vendorName: "South Coast Soccer League",
      vendorUrl: "https://www.southcoastsoccer.com",
      categoryId: catMap["PE & Sports"],
      itemName: "Soccer League Registration",
      description: "Youth soccer league registration for fall or spring season. Includes jersey, equipment, and 10-game season plus playoffs.",
      price: "150.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
    },
    {
      vendorName: "San Clemente Aquatics",
      vendorUrl: "https://www.sanclementeaquatics.com",
      categoryId: catMap["PE & Sports"],
      itemName: "Swimming Lessons 8-week",
      description: "8-week group swimming lessons at San Clemente Aquatic Center. 30-minute lessons twice per week. Level placement assessment included.",
      price: "160.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Tennis OC",
      vendorUrl: "https://www.tennisoc.com",
      categoryId: catMap["PE & Sports"],
      itemName: "Tennis Lessons 4-week",
      description: "4-week group tennis lessons for youth. One-hour lessons twice per week covering fundamentals, footwork, and match play.",
      price: "200.00",
      gradeLevels: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    // Art & Music (4 items)
    {
      vendorName: "Dana Point Arts Center",
      vendorUrl: "https://danapointarts.org",
      categoryId: catMap["Art & Music"],
      itemName: "Local Art Class 6-week",
      description: "6-week youth art class at local arts center. Students explore watercolor, acrylic, and mixed media techniques with professional instruction.",
      price: "180.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Music Together",
      vendorUrl: "https://www.musictogether.com",
      categoryId: catMap["Art & Music"],
      itemName: "Piano Lessons Monthly",
      description: "Monthly private piano lessons with a local certified music instructor. Four 30-minute lessons per month.",
      price: "120.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Jeremy P. Tarcher",
      vendorUrl: "https://www.penguinrandomhouse.com",
      categoryId: catMap["Art & Music"],
      itemName: "Drawing on the Right Side of the Brain",
      description: "Classic drawing instruction book that teaches anyone to draw using techniques based on perception and right-brain thinking. Includes workbook exercises.",
      price: "35.00",
      gradeLevels: ["7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Yamaha",
      vendorUrl: "https://www.yamaha.com",
      categoryId: catMap["Art & Music"],
      itemName: "Recorder Kit",
      description: "Soprano recorder with fingering chart and beginner songbook. Perfect for music fundamentals and basic music notation introduction.",
      price: "25.00",
      gradeLevels: ["1", "2", "3", "4", "5"],
    },
    // Tutoring (4 items)
    {
      vendorName: "Wyzant",
      vendorUrl: "https://www.wyzant.com",
      categoryId: catMap["Tutoring"],
      itemName: "Wyzant Tutoring Session 1hr",
      description: "One-hour online or in-person tutoring session through Wyzant platform. Subject specialists available for all subjects K-12.",
      price: "65.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Local Math Tutor",
      vendorUrl: "",
      categoryId: catMap["Tutoring"],
      itemName: "Local Math Tutor Session 1hr",
      description: "One-hour in-person math tutoring session with a local certified math tutor. Covers K-12 math including algebra, geometry, and pre-calculus.",
      price: "50.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Reading Specialists of Orange County",
      vendorUrl: "",
      categoryId: catMap["Tutoring"],
      itemName: "Reading Specialist Session 1hr",
      description: "One-hour session with a certified reading specialist. Ideal for students with dyslexia, reading delays, or those needing Orton-Gillingham instruction.",
      price: "75.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7"],
    },
    {
      vendorName: "iTalki",
      vendorUrl: "https://www.italki.com",
      categoryId: catMap["Tutoring"],
      itemName: "Online Spanish Tutor Session",
      description: "One-hour online Spanish tutoring session with a native-speaking community tutor. Conversational practice and grammar support.",
      price: "45.00",
      gradeLevels: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    // Online Courses (5 items)
    {
      vendorName: "Outschool",
      vendorUrl: "https://www.outschool.com",
      categoryId: catMap["Online Courses"],
      itemName: "Outschool Creative Writing Class",
      description: "6-week live online creative writing class for middle schoolers. Small group format with experienced teacher. Covers fiction, poetry, and creative non-fiction.",
      price: "45.00",
      gradeLevels: ["4", "5", "6", "7", "8", "9"],
    },
    {
      vendorName: "Outschool",
      vendorUrl: "https://www.outschool.com",
      categoryId: catMap["Online Courses"],
      itemName: "Outschool Coding for Kids",
      description: "8-week live online coding class teaching Scratch and Python basics. No prior experience required. Small group with real-time Q&A.",
      price: "55.00",
      gradeLevels: ["3", "4", "5", "6", "7", "8"],
    },
    {
      vendorName: "Johns Hopkins CTY",
      vendorUrl: "https://cty.jhu.edu",
      categoryId: catMap["Online Courses"],
      itemName: "CTY Johns Hopkins Online Course",
      description: "Self-paced online course from Johns Hopkins Center for Talented Youth. Rigorous academic courses in math, science, writing, and humanities.",
      price: "450.00",
      gradeLevels: ["6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Coursera",
      vendorUrl: "https://www.coursera.org",
      categoryId: catMap["Online Courses"],
      itemName: "Coursera Python Basics",
      description: "Self-paced online course covering Python programming fundamentals. Includes video lectures, coding exercises, and a certificate of completion.",
      price: "49.00",
      gradeLevels: ["7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Khan Academy",
      vendorUrl: "https://www.khanacademy.org",
      categoryId: catMap["Online Courses"],
      itemName: "Khan Academy SAT Prep",
      description: "Free official SAT prep in partnership with College Board. Full-length practice tests, personalized practice, and video lessons.",
      price: "0.00",
      gradeLevels: ["10", "11", "12"],
    },
    // Enrichment Activities (5 items)
    {
      vendorName: "National 4-H Council",
      vendorUrl: "https://4-h.org",
      categoryId: catMap["Enrichment Activities"],
      itemName: "4-H Club Annual Membership",
      description: "Annual membership in a local 4-H youth development club. Learn leadership, STEM, agriculture, and life skills through hands-on projects.",
      price: "25.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "Science Buddies",
      vendorUrl: "https://www.sciencebuddies.org",
      categoryId: catMap["Enrichment Activities"],
      itemName: "Science Fair Project Kit",
      description: "Complete science fair project kit with materials, experiment guide, display board, and data recording journal. Topic-specific kits available.",
      price: "40.00",
      gradeLevels: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "National Geographic",
      vendorUrl: "https://www.nationalgeographic.com",
      categoryId: catMap["Enrichment Activities"],
      itemName: "National Geographic Kids Subscription",
      description: "Annual print subscription to National Geographic Kids magazine. 10 issues per year covering science, nature, world cultures, and adventures.",
      price: "35.00",
      gradeLevels: ["0", "1", "2", "3", "4", "5", "6", "7"],
    },
    {
      vendorName: "San Clemente Chess Club",
      vendorUrl: "",
      categoryId: catMap["Enrichment Activities"],
      itemName: "Chess Club Registration",
      description: "Annual registration for after-school chess club. Weekly meetings, tournament opportunities, and online play access through Chess.com.",
      price: "60.00",
      gradeLevels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    },
    {
      vendorName: "iD Tech Camps",
      vendorUrl: "https://www.idtech.com",
      categoryId: catMap["Enrichment Activities"],
      itemName: "Robotics Camp Week",
      description: "One-week intensive robotics camp. Students design, build, and program robots using LEGO Mindstorms or VEX robotics kits.",
      price: "325.00",
      gradeLevels: ["3", "4", "5", "6", "7", "8", "9", "10"],
    },
  ];

  const createdCatalogItems: (typeof vendorCatalog.$inferSelect)[] = [];
  for (const item of catalogItems) {
    const [catalogItem] = await db
      .insert(vendorCatalog)
      .values({ ...item, schoolId: school.id })
      .returning();
    createdCatalogItems.push(catalogItem);
  }
  console.log(`   Created ${createdCatalogItems.length} catalog items across ${createdCategories.length} categories.\n`);

  // ── 8. Create purchase requests ───────────────────────────────────────────
  console.log("🛍️  Creating purchase requests...");

  const purchaseStatuses: (typeof schema.purchaseStatusEnum.enumValues[number])[] = [
    "approved", "approved", "pending", "ordered", "received",
    "denied", "pending", "approved", "received", "ordered",
    "pending", "approved", "received", "pending", "approved",
  ];

  const purchaseData = [
    { studentIdx: 0, itemIdx: 0 },   // Emma - Saxon Math
    { studentIdx: 1, itemIdx: 5 },   // Liam - All About Reading
    { studentIdx: 2, itemIdx: 10 },  // Olivia - Apologia Zoology
    { studentIdx: 3, itemIdx: 15 },  // Noah - Story of the World V1
    { studentIdx: 4, itemIdx: 22 },  // Ava - YMCA Sports
    { studentIdx: 5, itemIdx: 26 },  // Elijah - Art Class
    { studentIdx: 6, itemIdx: 30 },  // Sophia - Wyzant Tutoring
    { studentIdx: 7, itemIdx: 1 },   // James - Teaching Textbooks
    { studentIdx: 8, itemIdx: 6 },   // Isabella - IEW Writing
    { studentIdx: 9, itemIdx: 35 },  // Oliver - Outschool Creative Writing
    { studentIdx: 10, itemIdx: 40 }, // Mia - 4-H Membership
    { studentIdx: 11, itemIdx: 11 }, // William - Mystery Science
    { studentIdx: 12, itemIdx: 19 }, // Charlotte - Notgrass History
    { studentIdx: 13, itemIdx: 36 }, // Benjamin - Outschool Coding
    { studentIdx: 14, itemIdx: 27 }, // Amelia - Piano Lessons
  ];

  for (let i = 0; i < purchaseData.length; i++) {
    const { studentIdx, itemIdx } = purchaseData[i];
    const student = createdStudents[studentIdx];
    const catalogItem = createdCatalogItems[itemIdx % createdCatalogItems.length];
    const parent = createdParents[studentIdx];
    const status = purchaseStatuses[i % purchaseStatuses.length];
    const quantity = 1;
    const totalPrice = catalogItem.price;

    await db.insert(purchaseRequests).values({
      studentId: student.id,
      catalogItemId: catalogItem.id,
      quantity,
      unitPrice: catalogItem.price,
      totalPrice,
      status,
      requestedBy: parent.id,
      teacherNotes:
        status === "denied"
          ? "Item does not align with current IEP goals. Please discuss alternatives."
          : status === "approved"
          ? "Approved — aligns with student's learning plan."
          : null,
    });
  }
  console.log(`   Created ${purchaseData.length} purchase requests.\n`);

  // ── 9. Create a sample purchase order ─────────────────────────────────────
  console.log("📋 Creating sample purchase order...");
  await db.insert(purchaseOrders).values({
    schoolId: school.id,
    vendorName: "Saxon Publishers",
    items: [
      {
        catalogItemId: createdCatalogItems[0].id,
        itemName: "Saxon Math 5/4",
        vendorName: "Saxon Publishers",
        quantity: 3,
        unitPrice: "89.00",
        totalPrice: "267.00",
        studentIds: [createdStudents[0].id, createdStudents[7].id, createdStudents[11].id],
      },
    ],
    totalAmount: "267.00",
    poNumber: "PO-CCA-2024-001",
    status: "submitted",
    createdBy: admin.id,
  });
  console.log("   Created 1 sample purchase order.\n");

  // ── 10. Create engagement logs (Oct-Dec 2024, 3 months, 2-4 logs/wk) ─────
  console.log("📅 Creating engagement logs (Oct-Dec 2024)...");

  const oct1 = startOfMonth(new Date("2024-10-01"));
  const dec31 = new Date("2024-12-31");

  let totalLogs = 0;

  for (const student of createdStudents) {
    let currentDate = new Date(oct1);

    while (currentDate <= dec31) {
      // Generate 2-4 logs per week
      const logsThisWeek = randomBetween(2, 4);
      const daysUsed = new Set<number>();

      for (let l = 0; l < logsThisWeek; l++) {
        let dayOffset = randomBetween(0, 6);
        // Avoid duplicate days
        while (daysUsed.has(dayOffset)) {
          dayOffset = randomBetween(0, 6);
        }
        daysUsed.add(dayOffset);

        const logDate = addDays(currentDate, dayOffset);
        if (logDate > dec31) continue;

        const activityType = pick(ACTIVITY_TYPES);
        const descriptions = ACTIVITY_DESCRIPTIONS[activityType] ?? [
          "Completed activity successfully.",
        ];
        const description = pick(descriptions);
        const duration = pick([30, 45, 60, 90, 120]);

        await db.insert(engagementLogs).values({
          studentId: student.id,
          logDate: formatDate(logDate),
          activityType,
          durationMinutes: duration,
          description,
          loggedBy: teacher.id,
        });
        totalLogs++;
      }

      currentDate = addWeeks(currentDate, 1);
    }
  }
  console.log(`   Created ${totalLogs} engagement logs.\n`);

  // ── 11. Create progress notes ─────────────────────────────────────────────
  console.log("📝 Creating progress notes...");

  const progressNoteStudents = createdStudents.slice(0, 10);
  for (let i = 0; i < progressNoteStudents.length; i++) {
    const student = progressNoteStudents[i];
    const template = PROGRESS_NOTE_TEMPLATES[i % PROGRESS_NOTE_TEMPLATES.length];
    const gradeLabel = student.grade === 0 ? "K" : `${student.grade}`;
    const content = template.content(
      student.firstName,
      gradeLabel
    );
    const noteDate = subMonths(new Date("2024-12-01"), i % 3);

    await db.insert(studentProgressNotes).values({
      studentId: student.id,
      teacherId: teacher.id,
      noteDate: formatDate(noteDate),
      content,
      aiDrafted: template.aiDrafted,
      approvedBy: template.aiDrafted ? admin.id : null,
    });

    console.log(
      `   Note for ${student.firstName} ${student.lastName} — ${template.aiDrafted ? "AI-drafted" : "manual"}`
    );
  }
  console.log();

  // ── 12. Create newsletters ────────────────────────────────────────────────
  console.log("📰 Creating newsletters...");

  await db.insert(newsletters).values({
    schoolId: school.id,
    teacherId: teacher.id,
    title: NEWSLETTER_1.title,
    subjectLine: NEWSLETTER_1.subjectLine,
    contentJson: { blocks: [] },
    htmlContent: NEWSLETTER_1.htmlContent,
    status: "sent",
    recipientType: "all",
    sentAt: new Date("2024-10-01T09:00:00"),
  });

  await db.insert(newsletters).values({
    schoolId: school.id,
    teacherId: teacher.id,
    title: NEWSLETTER_2.title,
    subjectLine: NEWSLETTER_2.subjectLine,
    contentJson: { blocks: [] },
    htmlContent: NEWSLETTER_2.htmlContent,
    status: "sent",
    recipientType: "all",
    sentAt: new Date("2024-11-01T09:00:00"),
  });

  console.log("   Created 2 newsletters (October and November 2024).\n");

  // ── 13. Create contact logs ───────────────────────────────────────────────
  console.log("📞 Creating contact logs...");

  const contactTypes: (typeof schema.contactTypeEnum.enumValues[number])[] = [
    "email", "phone", "in-person", "newsletter",
  ];

  const contactNotes = [
    "Monthly check-in call — discussed curriculum progress and upcoming field trip.",
    "Sent email with October work sample feedback and recommendations.",
    "In-person meeting at coffee shop — reviewed student's science fair project plan.",
    "Newsletter sent to all families covering October learning highlights.",
    "Phone call regarding purchase request approval for math curriculum.",
    "Email follow-up with reading assessment results.",
    "Monthly check-in — parent expressed concern about writing development. Discussed strategies.",
    "In-person check-in during library visit.",
  ];

  for (let i = 0; i < Math.min(15, createdStudents.length); i++) {
    const student = createdStudents[i];
    const contactDate = addDays(oct1, randomBetween(0, 60));

    await db.insert(contactLogs).values({
      studentId: student.id,
      teacherId: teacher.id,
      contactDate: formatDate(contactDate),
      contactType: pick(contactTypes),
      notes: pick(contactNotes),
    });
  }
  console.log("   Created 15 contact logs.\n");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("✅ Seed complete! Summary:");
  console.log(`   - 1 school: Coastal Connections Academy`);
  console.log(`   - 2 staff users (1 teacher, 1 admin)`);
  console.log(`   - ${createdStudents.length} students`);
  console.log(`   - ${createdParents.length} parent users`);
  console.log(`   - ${createdStudents.length} student budgets at $2,000 each`);
  console.log(`   - ${createdCategories.length} vendor categories`);
  console.log(`   - ${createdCatalogItems.length} vendor catalog items`);
  console.log(`   - ${purchaseData.length} purchase requests`);
  console.log(`   - 1 purchase order`);
  console.log(`   - ${totalLogs} engagement logs (Oct-Dec 2024)`);
  console.log(`   - 10 student progress notes`);
  console.log(`   - 2 newsletters`);
  console.log(`   - 15 contact logs`);
  console.log("\n🎉 Database ready for development!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
