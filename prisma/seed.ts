import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: `file:${process.env.DATABASE_URL!.replace("file:", "")}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.intake.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords for demo users
  const saltRounds = 10;
  const demoPassword = await bcrypt.hash("demo123", saltRounds);

  // Create demo users
  const patientUser = await prisma.user.create({
    data: {
      email: "patient@demo.com",
      password: demoPassword,
      name: "Demo Patient",
      role: "PATIENT",
      organization: null,
    },
  });

  const reviewerUser = await prisma.user.create({
    data: {
      email: "reviewer@demo.com",
      password: demoPassword,
      name: "Dr. Sarah Chen",
      role: "REVIEWER",
      organization: "PharmaCorp Trial Coordinator",
    },
  });

  console.log("Created users:");
  console.log(
    `  - ${patientUser.email} (${patientUser.role}) - password: demo123`
  );
  console.log(
    `  - ${reviewerUser.email} (${reviewerUser.role}, ${reviewerUser.organization}) - password: demo123`
  );

  // Create a sample clinical trial enrollment application
  const sampleIntake = await prisma.intake.create({
    data: {
      clientName: "Jane Martinez",
      clientEmail: "jane.martinez@example.com",
      clientPhone: "555-987-6543",
      dateOfBirth: "1978-06-22",
      ssn: "987-65-4321",
      description:
        "Applying for Phase III cardiovascular clinical trial. History of hypertension, currently on beta blockers. Interested in participating to access new treatment options.",
      notes: "Referred by cardiologist Dr. Johnson. Patient meets initial age and diagnosis criteria.",
      status: "PENDING",
      submittedById: patientUser.id,
    },
  });

  // Create an audit log entry for the sample application
  await prisma.auditLog.create({
    data: {
      action: "CREATED",
      details: JSON.stringify({ status: "PENDING" }),
      userId: patientUser.id,
      intakeId: sampleIntake.id,
    },
  });

  console.log("Created sample enrollment application:");
  console.log(`  - Application ID: ${sampleIntake.id}`);
  console.log(`  - Status: ${sampleIntake.status}`);
  console.log(`  - Submitted by: ${patientUser.email}`);

  console.log("\nSeeding completed!");
  console.log("\n--- Demo Credentials ---");
  console.log("Patient: patient@demo.com / demo123");
  console.log("Reviewer: reviewer@demo.com / demo123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
