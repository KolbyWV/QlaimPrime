import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@as-integrations/express5';
import express from "express";
import cors from "cors";

import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { buildContext } from "./graphql/context.js";

const app = express();

app.use(cors());
app.use(express.json());

const server = new ApolloServer({ typeDefs, resolvers });

async function main() {
  await server.start();
  app.use("/graphql", expressMiddleware(server, { context: buildContext }));
  app.listen(4000, () => console.log("Running on :4000/graphql"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

