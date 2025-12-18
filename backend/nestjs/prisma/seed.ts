import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: "john.doe@example.com",
      name: "John Doe",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane.smith@example.com",
      name: "Jane Smith",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: "bob.wilson@example.com",
      name: "Bob Wilson",
    },
  });

  console.log(`✅ Created ${3} users`);

  // Create posts
  await prisma.post.create({
    data: {
      title: "Getting Started with Prisma",
      content: "Prisma is an amazing ORM for TypeScript and Node.js...",
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Building REST APIs with NestJS",
      content: "NestJS is a progressive Node.js framework...",
      published: true,
      authorId: user1.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Docker Best Practices",
      content: "When working with Docker in production...",
      published: false,
      authorId: user2.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "Introduction to PostgreSQL",
      content: "PostgreSQL is a powerful open-source database...",
      published: true,
      authorId: user2.id,
    },
  });

  await prisma.post.create({
    data: {
      title: "TypeScript Tips and Tricks",
      content: "Here are some useful TypeScript patterns...",
      published: false,
      authorId: user3.id,
    },
  });

  console.log(`✅ Created ${5} posts`);
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
