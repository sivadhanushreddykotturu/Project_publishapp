import { connectTestDb, disconnectTestDb, clearCollections } from "./setup";
import { User } from "../src/models/User";
import { Tester } from "../src/models/Tester";
import { WalletTransaction } from "../src/models/WalletTransaction";
import { creditEarning, requestWithdrawal, completeWithdrawal, rejectWithdrawal, getWalletSummary } from "../src/services/wallet.service";
import { env } from "../src/config/env";

async function makeAdmin() {
  return User.create({ clerkUserId: "clerk_admin", role: "admin", name: "Admin", email: "admin@test.com" });
}

async function makeTester() {
  const user = await User.create({ clerkUserId: "clerk_t1", role: "tester", name: "T1", email: "t1@test.com" });
  return Tester.create({ userId: user._id });
}

beforeAll(async () => {
  await connectTestDb();
});
afterAll(async () => {
  await disconnectTestDb();
});
afterEach(async () => {
  await clearCollections();
});

describe("wallet.service — manual UPI payout flow (no gateway payout, avoids commission)", () => {
  it("quotes a WITHDRAWAL_SLA_HOURS completion window when a withdrawal is requested", async () => {
    const tester = await makeTester();
    await creditEarning({ testerId: tester._id, amount: 10000 });

    const before = Date.now();
    const txn = await requestWithdrawal(tester._id, 10000);
    const after = Date.now();

    expect(txn.status).toBe("pending");
    const expected = txn.expectedCompletionAt!.getTime();
    expect(expected).toBeGreaterThanOrEqual(before + env.wallet.withdrawalSlaHours * 3_600_000 - 1000);
    expect(expected).toBeLessThanOrEqual(after + env.wallet.withdrawalSlaHours * 3_600_000 + 1000);
  });

  it("rejects a withdrawal request larger than the available balance", async () => {
    const tester = await makeTester();
    await creditEarning({ testerId: tester._id, amount: 5000 });
    await expect(requestWithdrawal(tester._id, 10000)).rejects.toThrow(/exceeds available balance/i);
  });

  it("completeWithdrawal is a single action: attaches the transaction ID and zeroes the balance", async () => {
    const tester = await makeTester();
    const admin = await makeAdmin();
    await creditEarning({ testerId: tester._id, amount: 10000 });
    const txn = await requestWithdrawal(tester._id, 10000);

    const completed = await completeWithdrawal(txn._id, admin._id, "UTR123456789");

    expect(completed.status).toBe("paid");
    expect(completed.transactionId).toBe("UTR123456789");

    const summary = await getWalletSummary(tester._id);
    expect(summary.balance).toBe(0);
  });

  it("refuses to complete a withdrawal that isn't pending", async () => {
    const tester = await makeTester();
    const admin = await makeAdmin();
    await creditEarning({ testerId: tester._id, amount: 10000 });
    const txn = await requestWithdrawal(tester._id, 10000);
    await completeWithdrawal(txn._id, admin._id, "UTR1");

    await expect(completeWithdrawal(txn._id, admin._id, "UTR2")).rejects.toThrow(/pending/i);
  });

  it("rejecting a withdrawal leaves the tester's balance untouched", async () => {
    const tester = await makeTester();
    const admin = await makeAdmin();
    await creditEarning({ testerId: tester._id, amount: 10000 });
    const txn = await requestWithdrawal(tester._id, 10000);

    const rejected = await rejectWithdrawal(txn._id, admin._id, "Suspicious UPI ID");
    expect(rejected.status).toBe("rejected");

    const summary = await getWalletSummary(tester._id);
    expect(summary.balance).toBe(10000);
  });

  it("never calls out to a payment gateway for payouts — transactionId is admin-supplied only", async () => {
    const tester = await makeTester();
    const admin = await makeAdmin();
    await creditEarning({ testerId: tester._id, amount: 10000 });
    const txn = await requestWithdrawal(tester._id, 10000);
    await completeWithdrawal(txn._id, admin._id, "manually-entered-utr");

    const stored = await WalletTransaction.findById(txn._id);
    expect(stored!.transactionId).toBe("manually-entered-utr");
  });
});
