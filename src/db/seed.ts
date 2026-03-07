import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects, pages, templates } from "./schema";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Seeding database...");

  // Create a test project
  const [project] = await db
    .insert(projects)
    .values({
      clientName: "Pagepro",
      clientEmail: "test@pagepro.co",
      websiteUrl: "https://pagepro.co",
      status: "created",
      settings: { pageLimit: 500, notes: "Test project for development" },
    })
    .returning();

  console.log(`Created project: ${project.id}`);

  // Create a template
  const [template] = await db
    .insert(templates)
    .values({
      projectId: project.id,
      name: "homepage",
      displayName: "Homepage",
      confidence: "high",
      pageCount: 1,
      complexity: "moderate",
    })
    .returning();

  // Create test pages
  const testPages = [
    {
      projectId: project.id,
      url: "https://pagepro.co/",
      title: "Pagepro - Next.js Development Company",
      h1: "We Build Next.js Applications",
      wordCount: 850,
      templateId: template.id,
      navigationDepth: 0,
    },
    {
      projectId: project.id,
      url: "https://pagepro.co/about",
      title: "About Pagepro",
      h1: "About Us",
      wordCount: 620,
      navigationDepth: 1,
    },
    {
      projectId: project.id,
      url: "https://pagepro.co/services",
      title: "Services - Pagepro",
      h1: "Our Services",
      wordCount: 450,
      navigationDepth: 1,
    },
    {
      projectId: project.id,
      url: "https://pagepro.co/case-studies",
      title: "Case Studies - Pagepro",
      h1: "Case Studies",
      wordCount: 380,
      navigationDepth: 1,
    },
    {
      projectId: project.id,
      url: "https://pagepro.co/contact",
      title: "Contact Us - Pagepro",
      h1: "Get in Touch",
      wordCount: 200,
      navigationDepth: 1,
    },
  ];

  await db.insert(pages).values(testPages);
  console.log(`Created ${testPages.length} pages`);

  await client.end();
  console.log("Seed complete!");
}

seed().catch(console.error);
