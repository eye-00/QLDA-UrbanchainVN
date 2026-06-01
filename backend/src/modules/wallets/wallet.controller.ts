import { Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { asyncHandler, badRequestError } from "../../lib/errors.js";
import { ok, created } from "../../lib/response.js";
import { connectWalletSchema, verifyWalletSchema } from "./wallet.validation.js";
import { toWalletItem } from "./wallet.mapper.js";
import * as walletService from "./wallet.service.js";

export const list = asyncHandler(async (req, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await walletService.listWallets(user);
  return ok(res, { items: result.items.map(toWalletItem), total: result.total });
});

export const connect = asyncHandler(async (req, res: Response) => {
  const parsed = connectWalletSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

  const user = (req as AuthenticatedRequest).user;
  const { address, network } = parsed.data as { address: string; network: string };
  const result = await walletService.connectWallet(user, { address, network });

  if (result.alreadyLinked) {
    return ok(res, toWalletItem(result.wallet), "Wallet already linked");
  }

  return created(res, toWalletItem(result.wallet), "Wallet linked. Verification is required.");
});

export const challenge = asyncHandler(async (req, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await walletService.createChallenge(user, req.params.id as string);
  return ok(res, result, "Verification challenge created");
});

export const verify = asyncHandler(async (req, res: Response) => {
  const parsed = verifyWalletSchema.safeParse(req.body);
  if (!parsed.success) throw badRequestError("Validation error", parsed.error.issues);

  const user = (req as AuthenticatedRequest).user;
  const wallet = await walletService.verifyWallet(
    user,
    req.params.id as string,
    parsed.data.signature
  );

  return ok(res, toWalletItem(wallet), "Wallet verified successfully");
});

export const setDefault = asyncHandler(async (req, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const wallet = await walletService.setDefaultWallet(user, req.params.id as string);
  return ok(res, toWalletItem(wallet), "Default wallet updated");
});
