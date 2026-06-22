// Tracks which two users are currently in a call (or a call is ringing
// between them), so that if either side disconnects unexpectedly we can
// notify the other side instead of leaving them hanging forever.

const callPairs = new Map<string, string>();

export const pairCall = (a: string, b: string) => {
  callPairs.set(a, b);
  callPairs.set(b, a);
};

export const unpairCall = (userId: string): string | undefined => {
  const partner = callPairs.get(userId);
  if (partner) {
    callPairs.delete(partner);
  }
  callPairs.delete(userId);
  return partner;
};