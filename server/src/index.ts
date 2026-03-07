import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@as-integrations/express5';
import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { buildContext } from "./graphql/context.js";

const app = express();

app.use(cors());
app.use(express.json());

// Rate limit auth-related GraphQL mutations to 5 attempts per 15 minutes per IP.
const AUTH_OPS = new Set(["Login", "Register", "RequestPasswordReset", "ResetPassword"]);
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !AUTH_OPS.has(req.body?.operationName),
  message: { errors: [{ message: "Too many attempts. Please try again later." }] },
});

const server = new ApolloServer({ typeDefs, resolvers });

async function main() {
  await server.start();
  app.use("/graphql", authRateLimiter);
  app.use("/graphql", expressMiddleware(server, { context: buildContext }));
  app.listen(process.env.PORT || 4000, () =>
    console.log(`Running on :${process.env.PORT || 4000}/graphql`)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

