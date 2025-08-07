'use server'

import { minhestFlag, rabattkodeFlag, aiWaitTimeFlag, newOldMineStallerDesignFlag } from "../../../flags";

export async function getMinhestFlag() {
  return await minhestFlag();
}

export async function getRabattkodeFlag() {
  return await rabattkodeFlag();
}

export async function getAiWaitTimeFlag() {
  return await aiWaitTimeFlag();
}

export async function getNewOldMineStallerDesignFlag() {
  return await newOldMineStallerDesignFlag();
}