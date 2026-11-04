const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const ChainState = require("../models/ChainState");

const computeHash = ({ index, prevHash, type, senderId, receiverId, amount, note, timestamp }) => {
  const data = [
    index,
    prevHash,
    type,
    senderId ? senderId.toString() : "system",
    receiverId ? receiverId.toString() : "system",
    Number(amount).toFixed(2),
    note || "",
    new Date(timestamp).getTime(),
  ].join("|");
  return crypto.createHash("sha256").update(data).digest("hex");
};

// Adds one transaction as a new block in the chain (must run inside a MongoDB session)
const appendBlock = async (txData, session) => {
  const state = await ChainState.findOneAndUpdate(
    { _id: "main" },
    { $inc: { height: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  const block = {
    ...txData,
    index: state.height,
    prevHash: state.lastHash,
    timestamp: new Date(),
  };
  block.hash = computeHash(block);

  const [saved] = await Transaction.create([block], { session });
  await ChainState.updateOne({ _id: "main" }, { lastHash: block.hash }, { session });
  return saved;
};

// Re-checks every block to detect tampering
const verifyChain = async () => {
  const blocks = await Transaction.find().sort({ index: 1 });
  let expectedPrev = "0".repeat(64);

  for (const b of blocks) {
    if (b.prevHash !== expectedPrev) {
      return { valid: false, brokenAt: b.index, reason: "prevHash does not match previous block" };
    }
    if (computeHash(b) !== b.hash) {
      return { valid: false, brokenAt: b.index, reason: "Block data was modified (hash mismatch)" };
    }
    expectedPrev = b.hash;
  }
  return { valid: true, totalBlocks: blocks.length };
};

module.exports = { computeHash, appendBlock, verifyChain };