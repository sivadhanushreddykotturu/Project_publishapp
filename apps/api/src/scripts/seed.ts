import "dotenv/config";
import mongoose from "mongoose";
import { Project, Client, User } from "../models/index.js";
import { getTemplate, createStepsFromTemplate } from "../services/workflow.js";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const existingProjects = await Project.countDocuments();
  console.log(`Found ${existingProjects} existing projects.`);

  if (existingProjects > 0) {
    console.log("Projects already exist, skipping seed.");
    process.exit(0);
  }

  // Find or create a demo client
  let clientUser = await User.findOne({ email: "demo-client@publishapp.com" });
  if (!clientUser) {
    clientUser = await User.create({
      clerkUserId: "seed_demo_client_user",
      role: "client",
      name: "Acme Apps Studio",
      email: "demo-client@publishapp.com",
      status: "active",
    });
  }

  let client = await Client.findOne({ userId: clientUser._id });
  if (!client) {
    client = await Client.create({
      userId: clientUser._id,
      companyName: "Acme Apps Studio",
      contactName: "Acme Lead",
      billingEmail: "billing@acmeapps.com",
    });
  }

  const template = getTemplate("play_store_internal", "starter");
  const steps = createStepsFromTemplate(template);

  const seedApps = [
    {
      appName: "Blinkit Quick Commerce",
      packageName: "com.grofers.customerapp",
      description: "10-minute grocery delivery app. Closed testing track to verify search, cart checkout and delivery address location accuracy on various Android models.",
      webOptInUrl: "https://play.google.com/apps/testing/com.grofers.customerapp",
      requiredTesters: 14,
      activeTesterCount: 10,
      waitlistCount: 0,
      joinState: "open" as const,
    },
    {
      appName: "Kanma Design Companion",
      packageName: "com.kanma.testerapp",
      description: "Mobile UI/UX feedback tool for designers and remote teams. Testing session recording and gesture interactions.",
      webOptInUrl: "https://play.google.com/apps/testing/com.kanma.testerapp",
      requiredTesters: 14,
      activeTesterCount: 7,
      waitlistCount: 0,
      joinState: "open" as const,
    },
    {
      appName: "Deloitte Field Ops",
      packageName: "com.deloitte.mobile.omnia",
      description: "Enterprise field inspection mobile tool. Verifying offline form submission and sync capabilities on Android 10+ devices.",
      webOptInUrl: "https://play.google.com/apps/testing/com.deloitte.mobile.omnia",
      requiredTesters: 14,
      activeTesterCount: 5,
      waitlistCount: 0,
      joinState: "open" as const,
    },
    {
      appName: "Swiggy Food & Dining",
      packageName: "in.swiggy.android",
      description: "Food order and live tracking closed test track. Validating notification reliability and payment callback flow.",
      webOptInUrl: "https://play.google.com/apps/testing/in.swiggy.android",
      requiredTesters: 15,
      activeTesterCount: 15,
      waitlistCount: 4,
      joinState: "full" as const,
    },
  ];

  for (const app of seedApps) {
    const proj = await Project.create({
      clientId: client._id,
      packageKey: "starter",
      projectType: "play_store_internal",
      appDetails: {
        appName: app.appName,
        packageName: app.packageName,
        description: app.description,
        webOptInUrl: app.webOptInUrl,
      },
      requiredTesters: app.requiredTesters,
      activeTesterCount: app.activeTesterCount,
      waitlistCount: app.waitlistCount,
      status: "active",
      joinState: app.joinState,
      steps,
      stepTemplateVersion: template.key,
      playIntegration: {
        mode: "manual",
        optInUrl: app.webOptInUrl,
        serviceAccountLinked: false,
      },
      paymentConfirmedAt: new Date(Date.now() - 3600_000 * 24),
      opportunityPublishedAt: new Date(Date.now() - 3600_000 * 12),
      ratedTesterIds: [],
    });
    console.log(`Created project: ${proj.appDetails.appName} (${proj._id})`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
