import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const QUIZZES_DATA = [
  // Lesson 1: The Solar System
  { lessonId: 1, question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correctAnswer: "8" },
  { lessonId: 1, question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: "Mars" },
  { lessonId: 1, question: "What type are the outer planets?", options: ["Rocky", "Gas & Ice Giants", "Dwarf", "Metallic"], correctAnswer: "Gas & Ice Giants" },
  // Lesson 2: Photosynthesis
  { lessonId: 2, question: "What gas do plants release during photosynthesis?", options: ["Carbon Dioxide", "Nitrogen", "Oxygen", "Hydrogen"], correctAnswer: "Oxygen" },
  { lessonId: 2, question: "Where does photosynthesis mainly occur?", options: ["Mitochondria", "Nucleus", "Chloroplasts", "Cell Wall"], correctAnswer: "Chloroplasts" },
  { lessonId: 2, question: "What pigment absorbs light for photosynthesis?", options: ["Melanin", "Chlorophyll", "Carotene", "Hemoglobin"], correctAnswer: "Chlorophyll" },
  // Lesson 3: Introduction to DNA
  { lessonId: 3, question: "What does DNA stand for?", options: ["Deoxyribonucleic Acid", "Dioxyribonucleic Acid", "Deoxyribonitric Acid", "Dynamic Nuclear Acid"], correctAnswer: "Deoxyribonucleic Acid" },
  { lessonId: 3, question: "Adenine (A) pairs with which base?", options: ["Cytosine", "Guanine", "Thymine", "Uracil"], correctAnswer: "Thymine" },
  { lessonId: 3, question: "What is the structure of DNA?", options: ["Single strand", "Triple helix", "Double helix", "Circular"], correctAnswer: "Double helix" },
  // Lesson 4: The Water Cycle
  { lessonId: 4, question: "What drives evaporation in the water cycle?", options: ["Wind", "Gravity", "The Sun", "Moon"], correctAnswer: "The Sun" },
  { lessonId: 4, question: "Clouds form through which process?", options: ["Evaporation", "Precipitation", "Condensation", "Filtration"], correctAnswer: "Condensation" },
  { lessonId: 4, question: "Rain, snow, and hail are forms of ___?", options: ["Evaporation", "Condensation", "Precipitation", "Transpiration"], correctAnswer: "Precipitation" },
  // Lesson 5: Basics of Electricity
  { lessonId: 5, question: "What type of current is used in homes?", options: ["DC", "AC", "Static", "Pulse"], correctAnswer: "AC" },
  { lessonId: 5, question: "Electricity is the flow of ___?", options: ["Protons", "Neutrons", "Electrons", "Photons"], correctAnswer: "Electrons" },
  { lessonId: 5, question: "Electrical power is measured in ___?", options: ["Volts", "Amperes", "Watts", "Ohms"], correctAnswer: "Watts" },
  // Lesson 6: Human Memory Types
  { lessonId: 6, question: "How many items can short-term memory hold?", options: ["3", "5", "7", "12"], correctAnswer: "7" },
  { lessonId: 6, question: "Which memory type stores skills and habits?", options: ["Sensory", "Explicit", "Implicit", "Short-term"], correctAnswer: "Implicit" },
  { lessonId: 6, question: "What helps consolidate memories into long-term storage?", options: ["Exercise", "Eating", "Sleep", "Reading"], correctAnswer: "Sleep" },
  // Lesson 7: Atoms & Elements
  { lessonId: 7, question: "What is the smallest unit of matter?", options: ["Molecule", "Cell", "Atom", "Electron"], correctAnswer: "Atom" },
  { lessonId: 7, question: "How many protons does Carbon have?", options: ["1", "6", "8", "12"], correctAnswer: "6" },
  { lessonId: 7, question: "What formula represents water?", options: ["CO₂", "H₂O", "O₂", "NaCl"], correctAnswer: "H₂O" },
  // Lesson 8: How the Internet Works
  { lessonId: 8, question: "What protocol suite does the internet primarily use?", options: ["HTTP/FTP", "TCP/IP", "SSH/SSL", "SMTP/POP"], correctAnswer: "TCP/IP" },
  { lessonId: 8, question: "What does DNS translate?", options: ["Files to data", "Domain names to IP addresses", "Images to text", "Code to binary"], correctAnswer: "Domain names to IP addresses" },
  { lessonId: 8, question: "Data travels the internet in small ___?", options: ["Bundles", "Packets", "Streams", "Blocks"], correctAnswer: "Packets" },
  // Lesson 9: HTML & CSS Fundamentals
  { lessonId: 9, question: "What does HTML stand for?", options: ["Hyper Tool Markup Language", "HyperText Markup Language", "Home Text Making Language", "HyperText Machine Language"], correctAnswer: "HyperText Markup Language" },
  { lessonId: 9, question: "Which language controls visual styling of a webpage?", options: ["HTML", "JavaScript", "CSS", "Python"], correctAnswer: "CSS" },
  { lessonId: 9, question: "Which CSS feature is used for responsive layouts?", options: ["Float", "Inline", "Flexbox", "Bold"], correctAnswer: "Flexbox" },
  // Lesson 10: Introduction to Python
  { lessonId: 10, question: "Who created Python?", options: ["Linus Torvalds", "Guido van Rossum", "James Gosling", "Brendan Eich"], correctAnswer: "Guido van Rossum" },
  { lessonId: 10, question: "Python uses ___ to define code blocks.", options: ["Braces {}", "Brackets []", "Indentation", "Semicolons"], correctAnswer: "Indentation" },
  { lessonId: 10, question: "Which is a Python web framework?", options: ["React", "Angular", "Django", "Laravel"], correctAnswer: "Django" },
  // Lesson 11: Cybersecurity Basics
  { lessonId: 11, question: "What is phishing?", options: ["A type of virus", "Fake emails to steal info", "A firewall tool", "A programming language"], correctAnswer: "Fake emails to steal info" },
  { lessonId: 11, question: "What does 2FA stand for?", options: ["Two-File Access", "Two-Factor Authentication", "Two-Firewall Admin", "Two-Format Algorithm"], correctAnswer: "Two-Factor Authentication" },
  { lessonId: 11, question: "The CIA Triad stands for ___?", options: ["Code, Internet, Algorithm", "Confidentiality, Integrity, Availability", "Central Intelligence Agency", "Computer, Interface, Application"], correctAnswer: "Confidentiality, Integrity, Availability" },
  // Lesson 12: Databases Explained
  { lessonId: 12, question: "SQL stands for ___?", options: ["Simple Query Logic", "Structured Query Language", "System Quality Layer", "Standard Question List"], correctAnswer: "Structured Query Language" },
  { lessonId: 12, question: "MongoDB is a ___ database.", options: ["Relational", "NoSQL", "Spreadsheet", "Graph-only"], correctAnswer: "NoSQL" },
  { lessonId: 12, question: "What uniquely identifies each record in a table?", options: ["Foreign Key", "Index", "Primary Key", "Column"], correctAnswer: "Primary Key" },
  // Lesson 13: What is Cloud Computing?
  { lessonId: 13, question: "Which is NOT a major cloud provider?", options: ["AWS", "Google Cloud", "Microsoft Azure", "Adobe Cloud"], correctAnswer: "Adobe Cloud" },
  { lessonId: 13, question: "Gmail is an example of which cloud model?", options: ["IaaS", "PaaS", "SaaS", "DaaS"], correctAnswer: "SaaS" },
  { lessonId: 13, question: "IaaS provides ___?", options: ["Ready-to-use apps", "Virtual machines", "Email services", "Social media"], correctAnswer: "Virtual machines" },
  // Lesson 14: APIs and How They Work
  { lessonId: 14, question: "What does API stand for?", options: ["App Programming Interface", "Application Programming Interface", "Auto Program Integration", "Applied Process Interface"], correctAnswer: "Application Programming Interface" },
  { lessonId: 14, question: "Which HTTP method retrieves data?", options: ["POST", "PUT", "DELETE", "GET"], correctAnswer: "GET" },
  { lessonId: 14, question: "APIs commonly return data in ___ format.", options: ["XML", "CSV", "JSON", "HTML"], correctAnswer: "JSON" },
  // Lesson 15: English Word Origins
  { lessonId: 15, question: "What percentage of English words come from Latin?", options: ["10%", "29%", "50%", "75%"], correctAnswer: "29%" },
  { lessonId: 15, question: "The word \"tsunami\" is borrowed from ___?", options: ["Chinese", "Korean", "Japanese", "Hindi"], correctAnswer: "Japanese" },
  { lessonId: 15, question: "How many words are in active English use?", options: ["50,000", "100,000", "170,000+", "500,000"], correctAnswer: "170,000+" },
  // Lesson 16: Japanese Writing Systems
  { lessonId: 16, question: "How many writing systems does Japanese use?", options: ["1", "2", "3", "4"], correctAnswer: "3" },
  { lessonId: 16, question: "Which system is used for foreign loanwords?", options: ["Hiragana", "Katakana", "Kanji", "Romaji"], correctAnswer: "Katakana" },
  { lessonId: 16, question: "Kanji characters originate from ___?", options: ["Korean", "Japanese", "Chinese", "Sanskrit"], correctAnswer: "Chinese" },
  // Lesson 17: Spanish for Beginners
  { lessonId: 17, question: "How many native Spanish speakers are there?", options: ["100 million", "250 million", "480+ million", "1 billion"], correctAnswer: "480+ million" },
  { lessonId: 17, question: "\"Gracias\" means ___ in English.", options: ["Hello", "Goodbye", "Please", "Thank you"], correctAnswer: "Thank you" },
  { lessonId: 17, question: "Spanish nouns have ___ (gender).", options: ["No gender", "Masculine & Feminine", "Three genders", "Neutral only"], correctAnswer: "Masculine & Feminine" },
  // Lesson 18: How Languages Evolve
  { lessonId: 18, question: "What did \"nice\" originally mean in the 13th century?", options: ["Beautiful", "Foolish", "Rich", "Kind"], correctAnswer: "Foolish" },
  { lessonId: 18, question: "The largest language family is ___?", options: ["Sino-Tibetan", "Afro-Asiatic", "Indo-European", "Austronesian"], correctAnswer: "Indo-European" },
  { lessonId: 18, question: "About how many languages exist worldwide?", options: ["500", "2,000", "7,000", "15,000"], correctAnswer: "7,000" },
  // Lesson 19: Coral Reefs
  { lessonId: 19, question: "Coral reefs support about ___% of marine species.", options: ["5%", "10%", "25%", "50%"], correctAnswer: "25%" },
  { lessonId: 19, question: "What is coral bleaching caused by?", options: ["Cold water", "Rising temperatures", "Too much salt", "Strong currents"], correctAnswer: "Rising temperatures" },
  { lessonId: 19, question: "The Great Barrier Reef is in ___?", options: ["Brazil", "Indonesia", "Australia", "Mexico"], correctAnswer: "Australia" },
  // Lesson 20: Volcanoes
  { lessonId: 20, question: "Magma that reaches the surface is called ___?", options: ["Ash", "Lava", "Pumice", "Basalt"], correctAnswer: "Lava" },
  { lessonId: 20, question: "Most volcanoes are along the ___?", options: ["Equator", "Ring of Fire", "Atlantic Ridge", "Arctic Circle"], correctAnswer: "Ring of Fire" },
  { lessonId: 20, question: "Mount Fuji is a ___ volcano.", options: ["Shield", "Cinder Cone", "Stratovolcano", "Caldera"], correctAnswer: "Stratovolcano" },
  // Lesson 21: Tropical Rainforests
  { lessonId: 21, question: "Rainforests cover about ___% of Earth's surface.", options: ["2%", "6%", "15%", "30%"], correctAnswer: "6%" },
  { lessonId: 21, question: "The largest rainforest is the ___?", options: ["Congo", "Borneo", "Amazon", "Daintree"], correctAnswer: "Amazon" },
  { lessonId: 21, question: "How many layers does a rainforest have?", options: ["2", "3", "4", "5"], correctAnswer: "4" },
];

/** Seed quizzes into the DB (idempotent — only runs if table is empty) */
export const seedQuizzes = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("quizzes").first();
    if (existing) return { seeded: false, count: 0 };

    for (const quiz of QUIZZES_DATA) {
      await ctx.db.insert("quizzes", quiz);
    }
    return { seeded: true, count: QUIZZES_DATA.length };
  },
});

/** Get all quizzes for a specific lesson */
export const getQuizzesByLesson = query({
  args: { lessonId: v.number() },
  handler: async (ctx, { lessonId }) => {
    return await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
      .collect();
  },
});
