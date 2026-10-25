import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { observeSession } from "./session.mjs";

test("access stays unresolved until Firebase restores the session", async () => {
  const states = [];
  let notify;
  const stop = observeSession(
    async () => ({
      auth: {},
      onAuthStateChanged: (_auth, callback) => {
        notify = callback;
        return () => {};
      },
    }),
    (state) => states.push(state.status),
  );
  assert.deepEqual(states, []);
  await setImmediate();
  assert.deepEqual(states, []);
  notify({ uid: "test-user" });
  assert.deepEqual(states, ["authenticated"]);
  stop();
});
test("anonymous users and sign-out are reported without retaining access", async () => {
  const states = [];
  let notify;
  const stop = observeSession(
    async () => ({
      auth: {},
      onAuthStateChanged: (_auth, callback) => {
        notify = callback;
        return () => {};
      },
    }),
    (state) => states.push(state.status),
  );
  await setImmediate();
  notify(null);
  notify({ uid: "test-user" });
  notify(null);
  assert.deepEqual(states, ["anonymous", "authenticated", "anonymous"]);
  stop();
});
test("loading errors fail closed", async () => {
  const states = [];
  observeSession(
    async () => {
      throw Error("Unavailable");
    },
    (state) => states.push(state.status),
  );
  await setImmediate();
  assert.deepEqual(states, ["error"]);
});
test("observer errors never grant access", async () => {
  const states = [];
  let reject;
  const stop = observeSession(
    async () => ({
      auth: {},
      onAuthStateChanged: (_auth, _callback, onError) => {
        reject = onError;
        return () => {};
      },
    }),
    (state) => states.push(state.status),
  );
  await setImmediate();
  reject(Error("Unavailable"));
  assert.deepEqual(states, ["error"]);
  stop();
});
test("unmount cleans up observers and ignores late notifications", async () => {
  const states = [];
  let notify;
  let unsubscribed = false;
  const stop = observeSession(
    async () => ({
      auth: {},
      onAuthStateChanged: (_auth, callback) => {
        notify = callback;
        return () => {
          unsubscribed = true;
        };
      },
    }),
    (state) => states.push(state.status),
  );
  await setImmediate();
  stop();
  notify({ uid: "test-user" });
  assert.equal(unsubscribed, true);
  assert.deepEqual(states, []);
});
test("unmount before loading completes never subscribes", async () => {
  let resolve;
  let subscribed = false;
  const stop = observeSession(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
    () => assert.fail("Unexpected state"),
  );
  await setImmediate();
  stop();
  resolve({
    auth: {},
    onAuthStateChanged: () => {
      subscribed = true;
    },
  });
  await setImmediate();
  assert.equal(subscribed, false);
});
