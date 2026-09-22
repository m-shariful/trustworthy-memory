export interface BenchmarkCase {
  id: string;
  query: string;
  include: string[];
  exclude: string[];
}

export const benchmarkCases: BenchmarkCase[] = [
  {
    id: "q01",
    query: "Where do I live?",
    include: ["memory-location-dhaka"],
    exclude: ["memory-location-mumbai", "memory-location-pune"],
  },
  {
    id: "q02",
    query: "Where do I live currently?",
    include: ["memory-location-dhaka"],
    exclude: ["memory-location-pune", "memory-location-mumbai"],
  },
  {
    id: "q03",
    query: "What software engineering work do I do?",
    include: ["memory-job-software"],
    exclude: ["memory-job-startup"],
  },
  {
    id: "q04",
    query: "What kind of engineer am I?",
    include: ["memory-job-software"],
    exclude: ["memory-job-startup"],
  },
  {
    id: "q05",
    query: "Which interface theme do I prefer?",
    include: ["memory-theme-dark"],
    exclude: ["memory-theme-light"],
  },
  {
    id: "q06",
    query: "What language do I prefer for explanations?",
    include: ["memory-language-bengali"],
    exclude: ["memory-language-english"],
  },
  {
    id: "q07",
    query: "What food do I enjoy?",
    include: ["memory-food-bangla"],
    exclude: ["memory-food-vegetarian"],
  },
  {
    id: "q08",
    query: "What hobbies do I enjoy?",
    include: ["memory-hobby-hiking", "memory-hobby-cooking"],
    exclude: [],
  },
  {
    id: "q09",
    query: "What programming language do I use?",
    include: ["memory-tech-typescript"],
    exclude: [],
  },
  {
    id: "q10",
    query: "What technology do I use with React?",
    include: ["memory-tech-react"],
    exclude: [],
  },
  {
    id: "q11",
    query: "What REST API technology do I use?",
    include: ["memory-api"],
    exclude: [],
  },
  {
    id: "q12",
    query: "What database do I use?",
    include: ["memory-database-mongo", "memory-database-postgres"],
    exclude: [],
  },
  {
    id: "q13",
    query: "What cloud platform do I use?",
    include: ["memory-cloud-gcp"],
    exclude: [],
  },
  {
    id: "q14",
    query: "Do I use Docker?",
    include: ["memory-cloud-docker"],
    exclude: [],
  },
  {
    id: "q15",
    query: "What kind of software engineering roles interest me?",
    include: ["memory-career-fullstack", "memory-remote"],
    exclude: [],
  },
  {
    id: "q16",
    query: "What am I learning about AI?",
    include: ["memory-career-ai"],
    exclude: [],
  },
  {
    id: "q17",
    query: "What am I studying about systems?",
    include: ["memory-system-design"],
    exclude: [],
  },
  {
    id: "q18",
    query: "Do I care about application security?",
    include: ["memory-security"],
    exclude: [],
  },
  {
    id: "q19",
    query: "Do I write automated tests?",
    include: ["memory-testing"],
    exclude: [],
  },
  {
    id: "q20",
    query: "What mobile technology am I learning?",
    include: ["memory-mobile"],
    exclude: [],
  },
  {
    id: "q21",
    query: "Do I enjoy product-focused software?",
    include: ["memory-product"],
    exclude: [],
  },
  {
    id: "q22",
    query: "Am I definitely moving to Pune?",
    include: [],
    exclude: ["memory-ambiguous-city"],
  },
];

export const MIN_BENCHMARK_CASES = 20;

if (benchmarkCases.length < MIN_BENCHMARK_CASES) {
  throw new Error(`Benchmark requires at least ${MIN_BENCHMARK_CASES} queries`);
}
