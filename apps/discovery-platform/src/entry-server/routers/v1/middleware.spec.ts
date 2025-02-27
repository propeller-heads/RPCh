import type { Express, NextFunction, Request, Response } from "express";
import { doesClientHaveQuota, getCache, setCache } from "./middleware";
import path from "path";
import {
  TestingDatabaseInstance,
  getTestingConnectionString,
} from "@rpch/common/build/internal/db";
import { MetricManager } from "@rpch/common/build/internal/metric-manager";
import * as Prometheus from "prom-client";
import { v1Router } from ".";
import memoryCache from "memory-cache";
import express from "express";
import request from "supertest";
import assert from "assert";
import { RegisteredNode } from "../../../types";

const BASE_QUOTA = BigInt(1);

const mockNode = (peerId?: string, hasExitNode?: boolean): RegisteredNode => ({
  hasExitNode: hasExitNode ?? true,
  peerId: peerId ?? "peerId",
  chainId: 100,
  hoprdApiEndpoint: "localhost:5000",
  hoprdApiToken: "someToken",
  exitNodePubKey: "somePubKey",
  nativeAddress: "someAddress",
});

const getAvailabilityMonitorResultsMock = () =>
  new Map<string, any>([["peerId_unstable", {}]]);

describe("test v1 middleware", function () {
  let dbInstance: TestingDatabaseInstance;
  let app: Express;

  beforeAll(async function () {
    const migrationsDirectory = path.join(__dirname, "../../../../migrations");
    dbInstance = await TestingDatabaseInstance.create(
      getTestingConnectionString(),
      migrationsDirectory
    );
  });

  beforeEach(async function () {
    await dbInstance.reset();
    const register = new Prometheus.Registry();
    const metricManager = new MetricManager(Prometheus, register, "test");
    app = express().use(
      "",
      v1Router({
        db: dbInstance.db,
        baseQuota: BASE_QUOTA,
        metricManager: metricManager,
        secret: "secret",
        getAvailabilityMonitorResults: getAvailabilityMonitorResultsMock,
      })
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    memoryCache.clear();
  });

  afterAll(async function () {
    await dbInstance.close();
  });

  it("should not allow request client does not have enough quota", async function () {
    // create quota for client
    await request(app).post("/client/quota").send({
      client: "client",
      quota: 1,
    });
    const doesClientHaveQuotaResponse = await doesClientHaveQuota(
      dbInstance.db,
      "client",
      BigInt(2)
    );

    assert.equal(doesClientHaveQuotaResponse, false);
  });
  it.only("should allow request because client has enough quota", async function () {
    // create quota client
    await request(app)
      .post("/client/quota")
      .send({
        client: "client",
        quota: 1,
      })
      .set("x-secret-key", "secret");

    const doesClientHaveQuotaResponse = await doesClientHaveQuota(
      dbInstance.db,
      "client",
      BigInt(1)
    );

    assert.equal(doesClientHaveQuotaResponse, true);
  });

  describe("test cache requests", function () {
    it("should save request", function () {
      const mockRequest = { url: "/test" } as Request;
      // just return whatever is sent using .json
      const mockResponse = {
        json: jest.fn((args) => args),
      } as unknown as Response;
      setCache("/test", 100, "test");
      const res = getCache(
        (req) => req.originalUrl || req.url,
        (b) => b
      )(mockRequest, mockResponse, {} as any);
      assert.equal(res, "test");
    });
    it("should call next if nothing is cached", async () => {
      const mockRequest = { url: "/test" } as Request;
      // just return whatever is sent using .json
      const mockResponse = {
        json: jest.fn((args) => args),
      } as unknown as Response;
      const mockNext = jest.fn() as NextFunction;
      // result
      getCache(
        (req) => req.originalUrl || req.url,
        (b) => b
      )(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
    it("should cache when request is successful", async function () {
      const responseRequestTrialClient = await request(app).get(
        "/request/trial"
      );
      const trialClientId: string = responseRequestTrialClient.body.client;

      await request(app)
        .post("/node/register")
        .set("X-Rpch-Client", trialClientId)
        .send(mockNode("exit1", true));
      await request(app)
        .post("/node/register")
        .set("X-Rpch-Client", trialClientId)
        .send(mockNode("exit2", true));

      // caching endpoint /node
      const allExitNodes = await request(app)
        .get(`/node?hasExitNode=true`)
        .set("X-Rpch-Client", trialClientId);
      const secondAllExitNodeResponse = await request(app)
        .get(`/node?hasExitNode=true`)
        .set("X-Rpch-Client", trialClientId);

      assert.deepEqual(
        JSON.stringify(memoryCache.get("/node?hasExitNode=true")),
        JSON.stringify(allExitNodes.body)
      );
      assert.deepEqual(
        JSON.stringify(memoryCache.get("/node?hasExitNode=true")),
        JSON.stringify(secondAllExitNodeResponse.body)
      );
    });
  });
});
