import { z } from "zod";
import { BlockchainNetwork } from "@prisma/client";

export const connectWalletSchema = z.object({
  address: z.string().min(1),
  network: z.nativeEnum(BlockchainNetwork)
});

export const verifyWalletSchema = z.object({
  signature: z.string().min(20)
});
