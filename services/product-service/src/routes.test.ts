import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@fastfood/shared", () => ({
  query: vi.fn(),
  getPool: vi.fn(),
}));

import { query } from "@fastfood/shared";
import Fastify from "fastify";
import { productRoutes } from "./routes";

const mockedQuery = vi.mocked(query);

async function buildTestApp() {
  const app = Fastify();
  await app.register(productRoutes);
  return app;
}

describe("Product Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("should return all available products", async () => {
      const mockProducts = [
        { id: 1, name: "Classic Burger", price: "89.00", category: "burgers", available: true },
        { id: 4, name: "French Fries", price: "35.00", category: "sides", available: true },
      ];
      mockedQuery.mockResolvedValue({ rows: mockProducts, command: "", rowCount: 2, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/products" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockProducts);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a single product", async () => {
      const mockProduct = { id: 1, name: "Classic Burger", price: "89.00", category: "burgers" };
      mockedQuery.mockResolvedValue({ rows: [mockProduct], command: "", rowCount: 1, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/products/1" });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockProduct);
    });

    it("should return 404 for non-existent product", async () => {
      mockedQuery.mockResolvedValue({ rows: [], command: "", rowCount: 0, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/products/999" });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({ error: "Product not found" });
    });
  });

  describe("GET /api/menu", () => {
    it("should return products grouped by category", async () => {
      const mockProducts = [
        { id: 1, name: "Classic Burger", price: "89.00", category: "burgers" },
        { id: 2, name: "Chicken Burger", price: "79.00", category: "burgers" },
        { id: 4, name: "French Fries", price: "35.00", category: "sides" },
      ];
      mockedQuery.mockResolvedValue({ rows: mockProducts, command: "", rowCount: 3, oid: 0, fields: [] });

      const app = await buildTestApp();
      const response = await app.inject({ method: "GET", url: "/api/menu" });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.burgers).toHaveLength(2);
      expect(body.sides).toHaveLength(1);
    });
  });
});
